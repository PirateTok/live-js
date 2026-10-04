import { EventEmitter } from "node:events";
import { fetchTTWID } from "./auth/ttwid.js";
import { checkOnline, fetchRoomInfo } from "./http/api.js";
import { buildWssUrl } from "./connection/url.js";
import { connectWss, DEFAULT_HEARTBEAT_MS } from "./connection/wss.js";
import { abortableSleep, superviseSessions } from "./connection/supervisor.js";
import type { SupervisorDeps } from "./connection/supervisor.js";
import { EventType, TikTokEvent } from "./events/types.js";
import type { EventTypeName } from "./events/types.js";
import type { RoomIdResult, RoomInfo } from "./http/api.js";
import { randomUa, systemLanguage, systemRegion } from "./http/ua.js";

export class TikTokLiveClient extends EventEmitter {
  private cdnHost = "webcast-ws.tiktok.com";
  private timeoutMs = 10_000;
  private _maxRetries = 5;
  private _staleTimeoutMs = 60_000;
  private _heartbeatMs = DEFAULT_HEARTBEAT_MS;
  private _userAgent: string | undefined;
  private _cookies: string | undefined;
  private _proxy: string | undefined;
  private _compress = true;
  private _language: string | undefined;
  private _region: string | undefined;
  private abortController: AbortController | null = null;

  constructor(private username: string) {
    super();
  }

  cdnEU(): this {
    this.cdnHost = "webcast-ws.eu.tiktok.com";
    return this;
  }

  cdnUS(): this {
    this.cdnHost = "webcast-ws.us.tiktok.com";
    return this;
  }

  cdn(host: string): this {
    this.cdnHost = host;
    return this;
  }

  timeout(ms: number): this {
    this.timeoutMs = ms;
    return this;
  }

  maxRetries(n: number): this {
    this._maxRetries = n;
    return this;
  }

  staleTimeout(ms: number): this {
    this._staleTimeoutMs = ms;
    return this;
  }

  /**
   * Set a custom user agent. When set, this UA is used for all requests
   * instead of the random pool. Omit or pass `undefined` to use the
   * built-in random UA rotation (recommended — reduces DEVICE_BLOCKED risk).
   */
  userAgent(ua: string): this {
    this._userAgent = ua;
    return this;
  }

  /**
   * Set session cookies for WSS connection (e.g. `"sessionid=xxx; sid_tt=xxx"`).
   * Only needed if you want to pass authenticated cookies alongside ttwid.
   * For room info on 18+ rooms, pass cookies directly to `fetchRoomInfo()` instead.
   */
  cookies(cookies: string): this {
    this._cookies = cookies;
    return this;
  }

  /**
   * Set a proxy URL for all HTTP and WSS connections.
   * Accepts HTTP, HTTPS, or SOCKS5 proxy URLs (e.g. `"http://host:port"`,
   * `"socks5://host:port"`); any other scheme throws.
   */
  proxy(url: string): this {
    this._proxy = url;
    return this;
  }

  /**
   * Enable or disable gzip compression on the WSS connection.
   * When disabled, TikTok sends uncompressed protobuf frames.
   * Default: `true` (gzip enabled).
   */
  compress(enabled: boolean): this {
    this._compress = enabled;
    return this;
  }

  language(lang: string): this {
    this._language = lang;
    return this;
  }

  region(reg: string): this {
    this._region = reg;
    return this;
  }

  /**
   * WSS heartbeat interval in ms (default 10 000). Also sent to TikTok as the
   * `heartbeat_duration` URL param.
   */
  heartbeatInterval(ms: number): this {
    this._heartbeatMs = ms;
    return this;
  }

  /**
   * Resolve the room, open the WSS and start streaming events.
   *
   * Resolves with the room ID once the first WSS handshake succeeds; the
   * reconnect loop keeps running in the background until `disconnect()` or
   * the retry budget is spent (then `disconnected` fires). Rejects if the
   * user is not live, or if the loop gives up before any handshake succeeded.
   */
  async connect(): Promise<string> {
    const lang = this._language ?? systemLanguage();
    const reg = this._region ?? systemRegion();
    const acceptLang = `${lang}-${reg},${lang};q=0.9`;

    const { roomId } = await checkOnline(this.username, this.timeoutMs, lang, reg, this._proxy);
    return this.runSessions(roomId, (signal) => ({
      newSession: async () => {
        const userAgent = this._userAgent ?? randomUa();
        const ttwid = await fetchTTWID(this.timeoutMs, userAgent, this._proxy);
        return { ttwid, userAgent };
      },
      runSession: (session, onOpen) => connectWss(
        buildWssUrl(this.cdnHost, roomId, lang, reg, this._compress, this._heartbeatMs),
        session.ttwid,
        roomId,
        {
          onEvent: (evt: TikTokEvent) => this.emit(evt.type, evt.data),
          onError: (err: Error) => this.emitError(err),
          onOpen,
          staleTimeoutMs: this._staleTimeoutMs,
        },
        signal,
        {
          userAgent: session.userAgent,
          cookies: this._cookies,
          acceptLanguage: acceptLang,
          proxy: this._proxy,
          heartbeatMs: this._heartbeatMs,
        },
      ),
      sleep: abortableSleep,
      now: () => Date.now(),
    }));
  }

  /** Event + promise wiring around the reconnect loop; `connect()` passes the live transport. */
  private runSessions(roomId: string, makeDeps: (signal: AbortSignal) => SupervisorDeps): Promise<string> {
    const controller = new AbortController();
    this.abortController = controller;
    const deps = makeDeps(controller.signal);

    this.emit(EventType.connected, { roomId });

    return new Promise<string>((resolve, reject) => {
      let opened = false;
      let lastError: Error | null = null;
      const finish = (err: Error | null): void => {
        if (this.abortController === controller) this.abortController = null;
        this.emit(EventType.disconnected, null);
        if (!opened) {
          reject(err ?? lastError ?? new Error("disconnected before the WSS handshake completed"));
        } else if (err) {
          this.emitError(err);
        }
      };

      superviseSessions(deps, this._maxRetries, controller.signal, {
        onOpen: () => {
          if (opened) return;
          opened = true;
          resolve(roomId);
        },
        onReconnecting: (info) => this.emit(EventType.reconnecting, info),
        onError: (err) => {
          lastError = err;
          this.emitError(err);
        },
      }).then(() => finish(null), (err: unknown) => finish(err instanceof Error ? err : new Error(String(err))));
    });
  }

  /** `error` is only emitted when someone listens — an unheard `error` would crash the loop. */
  private emitError(err: Error): void {
    if (this.listenerCount("error") > 0) this.emit("error", err);
  }

  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  on(event: EventTypeName | "error", listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  static async checkOnline(username: string, timeoutMs?: number): Promise<RoomIdResult> {
    return checkOnline(username, timeoutMs);
  }

  static async fetchRoomInfo(roomId: string, timeoutMs?: number, cookies?: string): Promise<RoomInfo> {
    return fetchRoomInfo(roomId, timeoutMs, cookies);
  }
}

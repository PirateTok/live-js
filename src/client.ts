import { EventEmitter } from "node:events";
import { fetchTTWID } from "./auth/ttwid.js";
import { checkOnline, fetchRoomInfo, DeviceBlockedError } from "./http/api.js";
import { buildWssUrl } from "./connection/url.js";
import { connectWss } from "./connection/wss.js";
import { EventType, TikTokEvent } from "./events/types.js";
import type { EventTypeName } from "./events/types.js";
import type { RoomIdResult, RoomInfo } from "./http/api.js";
import { systemLanguage, systemRegion } from "./http/ua.js";

export class TikTokLiveClient extends EventEmitter {
  private cdnHost = "webcast-ws.tiktok.com";
  private timeoutMs = 10_000;
  private _maxRetries = 5;
  private _staleTimeoutMs = 60_000;
  private _userAgent: string | undefined;
  private _cookies: string | undefined;
  private _proxy: string | undefined;
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
   * Accepts HTTP, HTTPS, or SOCKS5 proxy URLs (e.g. `"http://host:port"`).
   * Uses `undici.ProxyAgent` under the hood — requires Node 18+.
   */
  proxy(url: string): this {
    this._proxy = url;
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

  async connect(): Promise<string> {
    const lang = this._language ?? systemLanguage();
    const reg = this._region ?? systemRegion();
    const acceptLang = `${lang}-${reg},${lang};q=0.9`;

    const room = await checkOnline(this.username, this.timeoutMs, lang, reg, this._proxy);
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.emit(EventType.connected, { roomId: room.roomId });

    let attempt = 0;
    while (!signal.aborted) {
      const ttwid = await fetchTTWID(this.timeoutMs, this._userAgent, this._proxy);
      if (signal.aborted) break;
      const wssUrl = buildWssUrl(this.cdnHost, room.roomId, lang, reg);

      let deviceBlocked = false;
      try {
        await connectWss(wssUrl, ttwid, room.roomId, {
          onEvent: (evt: TikTokEvent) => this.emit(evt.type, evt.data),
          onError: (err: Error) => this.emit("error", err),
          staleTimeoutMs: this._staleTimeoutMs,
        }, signal, {
          userAgent: this._userAgent,
          cookies: this._cookies,
          acceptLanguage: acceptLang,
          proxy: this._proxy,
        });
      } catch (err: unknown) {
        if (err instanceof DeviceBlockedError) {
          deviceBlocked = true;
        } else {
          this.emit("error", err instanceof Error ? err : new Error(String(err)));
        }
      }

      if (signal.aborted) break;

      attempt++;
      if (attempt > this._maxRetries) break;

      // On DEVICE_BLOCKED: short 2s delay since we're getting a fresh
      // ttwid + UA anyway. On other errors: exponential backoff.
      const delay = deviceBlocked
        ? 2_000
        : Math.min(1 << attempt, 30) * 1000;
      this.emit(EventType.reconnecting, {
        attempt, maxRetries: this._maxRetries, delayMs: delay,
        deviceBlocked,
      });

      await new Promise<void>((r) => {
        const timer = setTimeout(r, delay);
        signal.addEventListener("abort", () => { clearTimeout(timer); r(); }, { once: true });
      });
    }

    this.emit(EventType.disconnected, null);
    return room.roomId;
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

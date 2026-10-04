import WebSocket from "ws";
import type { ClientRequestArgs } from "node:http";
import { root } from "../proto/schema.js";
import { buildHeartbeat, buildEnterRoom, buildAck, decompressIfGzipped } from "./frames.js";
import { decode } from "../events/router.js";
import { TikTokEvent } from "../events/types.js";
import { DeviceBlockedError } from "../http/api.js";
import { randomUa, systemLocale } from "../http/ua.js";
import { makeWssProxyAgent } from "../http/proxy.js";

const PushFrame = root.lookupType("WebcastPushFrame");
const Response = root.lookupType("WebcastResponse");

export const DEFAULT_HEARTBEAT_MS = 10_000;

export interface WssCallbacks {
  onEvent: (event: TikTokEvent) => void;
  /** Non-fatal errors while streaming (frame decode failures). */
  onError: (error: Error) => void;
  /** Called once the WSS handshake succeeded. */
  onOpen?: () => void;
  staleTimeoutMs?: number;
}

export interface WssOptions {
  /** User agent override. When omitted, a random UA from the pool is used. */
  userAgent?: string;
  /** Extra cookies to append alongside ttwid (e.g. session cookies). */
  cookies?: string;
  /** Accept-Language header override. Auto-detected from system locale when omitted. */
  acceptLanguage?: string;
  /** Proxy URL for WSS connection (e.g. "http://host:port"). */
  proxy?: string;
  /** Heartbeat interval in ms (default 10 000). */
  heartbeatMs?: number;
}

/**
 * Opens a single WSS connection and streams events.
 * Resolves when the connection closes (stale, server close, or abort).
 * Rejects with `DeviceBlockedError` if the handshake returns DEVICE_BLOCKED,
 * or with the underlying error on handshake rejection / socket error.
 */
export function connectWss(
  wssUrl: string,
  ttwid: string,
  roomId: string,
  callbacks: WssCallbacks,
  signal: AbortSignal,
  options?: WssOptions,
): Promise<void> {
  const staleMs = callbacks.staleTimeoutMs ?? 60_000;
  const heartbeatMs = options?.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const ua = options?.userAgent ?? randomUa();
  const cookieHeader = options?.cookies
    ? `ttwid=${ttwid}; ${options.cookies}`
    : `ttwid=${ttwid}`;
  let acceptLang = options?.acceptLanguage;
  if (!acceptLang) {
    const [sl, sr] = systemLocale();
    acceptLang = `${sl}-${sr},${sl};q=0.9`;
  }

  return new Promise((resolve, reject) => {
    const wsOpts: WebSocket.ClientOptions & ClientRequestArgs = {
      headers: {
        "User-Agent": ua,
        Cookie: cookieHeader,
        Origin: "https://www.tiktok.com",
        Referer: "https://www.tiktok.com/",
        "Accept-Language": acceptLang,
        "Cache-Control": "no-cache",
      },
    };
    const proxyAgent = makeWssProxyAgent(options?.proxy);
    if (proxyAgent) wsOpts.agent = proxyAgent;
    const ws = new WebSocket(wssUrl, wsOpts);

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let staleTimer: ReturnType<typeof setTimeout> | null = null;

    function resetStale(): void {
      if (staleTimer) clearTimeout(staleTimer);
      staleTimer = setTimeout(() => finish(), staleMs);
    }

    let settled = false;
    function finish(err?: Error): void {
      cleanup();
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (err) reject(err);
      else resolve();
    }

    function cleanup(): void {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      if (staleTimer) clearTimeout(staleTimer);
      staleTimer = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      }
    }

    const onAbort = (): void => finish();
    signal.addEventListener("abort", onAbort, { once: true });

    // Detect DEVICE_BLOCKED on failed WebSocket upgrade (non-101 HTTP response).
    // The `ws` library emits "unexpected-response" before "error" for HTTP rejections.
    ws.on("unexpected-response", (_req, res) => {
      const handshakeMsg = res.headers["handshake-msg"] ?? "";
      res.resume(); // drain response to free socket
      finish(handshakeMsg === "DEVICE_BLOCKED"
        ? new DeviceBlockedError()
        : new Error(
          `WSS handshake rejected: HTTP ${res.statusCode}` +
          ` handshake-msg=${handshakeMsg}` +
          ` handshake-status=${res.headers["handshake-status"] ?? "?"}`,
        ));
    });

    ws.on("open", () => {
      ws.send(buildHeartbeat(roomId));
      ws.send(buildEnterRoom(roomId));

      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(buildHeartbeat(roomId));
        }
      }, heartbeatMs);

      resetStale();
      callbacks.onOpen?.();
    });

    ws.on("message", (raw: Buffer) => {
      resetStale();
      try {
        processFrame(raw, ws, roomId, callbacks);
      } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)));
      }
    });

    ws.on("close", () => finish());

    ws.on("error", (err) => finish(signal.aborted ? undefined : err));
  });
}

function processFrame(raw: Buffer, ws: WebSocket, roomId: string, callbacks: WssCallbacks): void {
  const frame = PushFrame.decode(new Uint8Array(raw)) as unknown as {
    payloadType: string;
    payload: Uint8Array;
    logId: number;
  };

  switch (frame.payloadType) {
    case "msg": {
      const decompressed = decompressIfGzipped(frame.payload);
      const response = Response.decode(decompressed) as unknown as {
        messages: Array<{ method: string; payload: Uint8Array }>;
        needsAck: boolean;
        internalExt: Uint8Array;
      };

      if (response.needsAck && response.internalExt?.length > 0) {
        const ackBuf = buildAck(frame.logId, response.internalExt);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(ackBuf);
        }
      }

      for (const msg of response.messages ?? []) {
        const events = decode(msg.method, msg.payload);
        for (const evt of events) {
          evt.roomId = roomId;
          callbacks.onEvent(evt);
        }
      }
      break;
    }
    case "im_enter_room_resp":
    case "hb":
      break;
  }
}

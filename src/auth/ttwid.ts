import { randomUa } from "../http/ua.js";
import { proxyFetch } from "../http/proxy.js";

const TIKTOK_URL = "https://www.tiktok.com/";

/** tiktok.com only sets ttwid on ~1/5–1/8 anonymous GETs — retry this many times. */
export const TTWID_FETCH_ATTEMPTS = 8;
export const TTWID_RETRY_DELAY_MS = 750;

/** TikTok answered but set no ttwid cookie. Retryable; transport errors are not. */
export class TtwidMissingError extends Error {
  constructor(public statusCode: number) {
    super(`ttwid: no ttwid cookie in response (status ${statusCode})`);
    this.name = "TtwidMissingError";
  }
}

export interface TtwidOptions {
  /** Bootstrap URL (default `https://www.tiktok.com/`). */
  url?: string;
  /** Total attempts when the cookie is missing (default 8). */
  attempts?: number;
  /** Delay between attempts in ms (default 750). */
  retryDelayMs?: number;
}

/**
 * Fetches a fresh ttwid cookie via anonymous GET to tiktok.com.
 * No auth, no browser, no signing required.
 *
 * A response without the cookie is retried (8 attempts, 750 ms apart by
 * default); transport errors (DNS, TLS, timeout) are thrown immediately.
 *
 * @param timeoutMs  Request timeout in milliseconds (default 10s).
 * @param userAgent  Optional UA override. When omitted, a random UA from the
 *                   built-in pool is used for every attempt of this call.
 * @param proxy      Optional proxy URL (e.g. "http://host:port").
 */
export async function fetchTTWID(
  timeoutMs = 10_000,
  userAgent?: string,
  proxy?: string,
  options: TtwidOptions = {},
): Promise<string> {
  const ua = userAgent ?? randomUa();
  const url = options.url ?? TIKTOK_URL;
  const attempts = options.attempts ?? TTWID_FETCH_ATTEMPTS;
  const delayMs = options.retryDelayMs ?? TTWID_RETRY_DELAY_MS;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchOnce(url, timeoutMs, ua, proxy);
    } catch (err) {
      if (!(err instanceof TtwidMissingError) || attempt >= attempts) throw err;
    }
    await new Promise<void>((r) => setTimeout(r, delayMs));
  }
}

async function fetchOnce(url: string, timeoutMs: number, ua: string, proxy?: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await proxyFetch(url, {
      headers: { "User-Agent": ua },
      redirect: "manual",
      signal: controller.signal,
    }, proxy);
    await resp.arrayBuffer();

    for (const cookie of resp.headers.getSetCookie?.() ?? []) {
      const match = cookie.match(/^ttwid=([^;]+)/);
      if (match && match[1]) return match[1];
    }
    // Node < 18.14 has no getSetCookie(): fall back to the joined header.
    const fallback = (resp.headers.get("set-cookie") ?? "").match(/ttwid=([^;]+)/);
    if (fallback && fallback[1]) return fallback[1];
    throw new TtwidMissingError(resp.status);
  } finally {
    clearTimeout(timer);
  }
}

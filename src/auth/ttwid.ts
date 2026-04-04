import { randomUa } from "../http/ua.js";

/**
 * Fetches a fresh ttwid cookie via anonymous GET to tiktok.com.
 * No auth, no browser, no signing required.
 *
 * @param timeoutMs  Request timeout in milliseconds (default 10s).
 * @param userAgent  Optional UA override. When omitted, a random UA from the
 *                   built-in pool is used (recommended for DEVICE_BLOCKED rotation).
 */
export async function fetchTTWID(timeoutMs = 10_000, userAgent?: string): Promise<string> {
  const ua = userAgent ?? randomUa();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch("https://www.tiktok.com/", {
      headers: { "User-Agent": ua },
      redirect: "manual",
      signal: controller.signal,
    });

    const setCookie = resp.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookie) {
      const match = cookie.match(/^ttwid=([^;]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback: try raw set-cookie header
    const raw = resp.headers.get("set-cookie") ?? "";
    const fallback = raw.match(/ttwid=([^;]+)/);
    if (fallback && fallback[1]) {
      return fallback[1];
    }

    throw new Error(`ttwid: no ttwid cookie in response (status ${resp.status})`);
  } finally {
    clearTimeout(timer);
  }
}

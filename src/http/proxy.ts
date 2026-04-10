import type { Agent as HttpAgent } from "node:http";

/**
 * Creates an undici ProxyAgent dispatcher for use with Node's fetch().
 * Returns undefined when no proxy is configured or undici is unavailable.
 */
export function makeProxyDispatcher(proxy?: string): unknown | undefined {
  if (!proxy) return undefined;
  try {
    // undici ships with Node 18+ — use its ProxyAgent for proxy support
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const undici = require("undici");
    return new undici.ProxyAgent(proxy);
  } catch {
    // undici not available (e.g. older Node, bundled for browser)
    return undefined;
  }
}

/**
 * Creates an http.Agent for proxying WebSocket connections via the `ws` library.
 * Tries `https-proxy-agent` (user-installed optional dep) first, then `http-proxy-agent`.
 * Returns undefined when no proxy is configured or no proxy agent package is available.
 *
 * Install one of these for WSS proxy support:
 *   npm install https-proxy-agent
 *   npm install http-proxy-agent
 */
export function makeWssProxyAgent(proxy?: string): HttpAgent | undefined {
  if (!proxy) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("https-proxy-agent");
    const Ctor = mod.HttpsProxyAgent ?? mod.default ?? mod;
    return new Ctor(proxy);
  } catch {
    // https-proxy-agent not installed — try http-proxy-agent
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("http-proxy-agent");
    const Ctor = mod.HttpProxyAgent ?? mod.default ?? mod;
    return new Ctor(proxy);
  } catch {
    // no proxy agent package available
    return undefined;
  }
}

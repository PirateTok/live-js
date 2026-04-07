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

import type { Agent as HttpAgent } from "node:http";
import { fetch as undiciFetch, ProxyAgent, Socks5ProxyAgent } from "undici";
import type { Dispatcher } from "undici";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

type ProxyKind = "http" | "socks";

function proxyKind(proxy: string): ProxyKind {
  const scheme = new URL(proxy).protocol;
  if (scheme === "http:" || scheme === "https:") return "http";
  if (scheme === "socks5:" || scheme === "socks5h:" || scheme === "socks:") return "socks";
  throw new Error(`unsupported proxy scheme "${scheme}" — use http://, https:// or socks5://`);
}

const dispatchers = new Map<string, Dispatcher>();

function dispatcherFor(proxy: string): Dispatcher {
  let d = dispatchers.get(proxy);
  if (!d) {
    d = proxyKind(proxy) === "socks" ? new Socks5ProxyAgent(proxy) : new ProxyAgent(proxy);
    dispatchers.set(proxy, d);
  }
  return d;
}

/**
 * `fetch()` routed through `proxy` (HTTP/HTTPS/SOCKS5) when given, plain
 * global `fetch()` otherwise.
 */
export async function proxyFetch(
  url: string,
  init: { headers?: Record<string, string>; redirect?: "manual" | "follow"; signal?: AbortSignal },
  proxy?: string,
): Promise<Response> {
  if (!proxy) return fetch(url, init);
  const resp = await undiciFetch(url, { ...init, dispatcher: dispatcherFor(proxy) });
  return resp as unknown as Response;
}

/** `http.Agent` that tunnels the WSS connection through `proxy`, or undefined without one. */
export function makeWssProxyAgent(proxy?: string): HttpAgent | undefined {
  if (!proxy) return undefined;
  return proxyKind(proxy) === "socks" ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy);
}

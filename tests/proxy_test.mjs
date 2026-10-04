// Proxy wiring — offline, local HTTP CONNECT proxy + minimal SOCKS5 server.
//
// P1: HTTP (ttwid fetch) through an HTTP proxy
// P2: HTTP (ttwid fetch) through a SOCKS5 proxy
// P3: WSS through an HTTP proxy
// P4: WSS through a SOCKS5 proxy
// P5: unsupported proxy scheme is an error, not silently ignored
//
// Run: node --test tests/proxy_test.mjs

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import { createServer as createTcpServer, connect } from "node:net";
import { WebSocketServer } from "ws";

import { fetchTTWID } from "../dist/auth/ttwid.js";
import { connectWss } from "../dist/connection/wss.js";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function pipeTo(client, host, port, onUp) {
  const upstream = connect(port, host, () => {
    onUp();
    upstream.pipe(client);
    client.pipe(upstream);
  });
  upstream.on("error", () => client.destroy());
  client.on("error", () => upstream.destroy());
}

function httpProxy(seen) {
  // Plain http:// targets arrive as absolute-URI requests, https:// and ws(s) as CONNECT.
  const proxy = createHttpServer((req, res) => {
    const url = new URL(req.url);
    seen.push(`FORWARD ${url.host}`);
    const up = httpRequest(url, { method: req.method, headers: req.headers }, (upRes) => {
      res.writeHead(upRes.statusCode, upRes.headers);
      upRes.pipe(res);
    });
    up.on("error", () => res.destroy());
    req.pipe(up);
  });
  proxy.on("connect", (req, client, head) => {
    seen.push(`CONNECT ${req.url}`);
    const [host, port] = req.url.split(":");
    pipeTo(client, host, Number(port), () => {
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length) client.unshift(head);
    });
  });
  return proxy;
}

function socks5Proxy(seen) {
  return createTcpServer((client) => {
    client.once("data", () => {
      client.write(Buffer.from([5, 0]));
      client.once("data", (req) => {
        let host;
        let off;
        if (req[3] === 1) { host = [...req.subarray(4, 8)].join("."); off = 8; }
        else if (req[3] === 3) { host = req.subarray(5, 5 + req[4]).toString(); off = 5 + req[4]; }
        else { client.destroy(); return; }
        const port = req.readUInt16BE(off);
        seen.push(`SOCKS ${host}:${port}`);
        pipeTo(client, host, port, () => client.write(Buffer.from([5, 0, 0, 1, 0, 0, 0, 0, 0, 0])));
      });
    });
  });
}

let target;
let targetPort;
let wsTarget;
let wsServer;
let wsPort;

before(async () => {
  target = createHttpServer((_req, res) => {
    res.setHeader("Set-Cookie", "ttwid=via-proxy; Path=/");
    res.end("ok");
  });
  targetPort = await listen(target);
  wsTarget = createHttpServer();
  wsServer = new WebSocketServer({ server: wsTarget });
  wsServer.on("connection", (sock) => sock.once("message", () => sock.close()));
  wsPort = await listen(wsTarget);
});

after(() => {
  target.close();
  wsServer.close();
  wsTarget.close();
});

async function withProxy(make, scheme, fn) {
  const seen = [];
  const server = make(seen);
  const port = await listen(server);
  try {
    await fn(`${scheme}://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
  return seen;
}

async function wssOpens(proxy) {
  let opened = false;
  await connectWss(`ws://127.0.0.1:${wsPort}/`, "t", "1", {
    onEvent: () => {}, onError: () => {}, onOpen: () => { opened = true; },
  }, new AbortController().signal, { userAgent: "ua", proxy });
  assert.ok(opened);
}

describe("proxy", () => {
  it("P1 HTTP through HTTP proxy", async () => {
    const seen = await withProxy(httpProxy, "http", async (proxy) => {
      assert.equal(await fetchTTWID(2_000, "ua", proxy, { url: `http://127.0.0.1:${targetPort}/` }), "via-proxy");
    });
    assert.deepEqual(seen, [`FORWARD 127.0.0.1:${targetPort}`]);
  });

  it("P2 HTTP through SOCKS5 proxy", async () => {
    const seen = await withProxy(socks5Proxy, "socks5", async (proxy) => {
      assert.equal(await fetchTTWID(2_000, "ua", proxy, { url: `http://127.0.0.1:${targetPort}/` }), "via-proxy");
    });
    assert.deepEqual(seen, [`SOCKS 127.0.0.1:${targetPort}`]);
  });

  it("P3 WSS through HTTP proxy", async () => {
    const seen = await withProxy(httpProxy, "http", wssOpens);
    assert.deepEqual(seen, [`CONNECT 127.0.0.1:${wsPort}`]);
  });

  it("P4 WSS through SOCKS5 proxy", async () => {
    const seen = await withProxy(socks5Proxy, "socks5", wssOpens);
    assert.deepEqual(seen, [`SOCKS 127.0.0.1:${wsPort}`]);
  });

  it("P5 unsupported scheme throws", async () => {
    await assert.rejects(fetchTTWID(2_000, "ua", "ftp://127.0.0.1:1", { url: "http://127.0.0.1:1/" }),
      /unsupported proxy scheme/);
  });
});

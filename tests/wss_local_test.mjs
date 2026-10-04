// WSS layer against a local server — offline.
//
// L1: onOpen fires on handshake, heartbeat + enter_room sent, resolves on server close
// L2: 415 + Handshake-Msg DEVICE_BLOCKED → rejects with DeviceBlockedError
// L3: heartbeatMs option drives the heartbeat cadence
// L4: heartbeat_duration URL param follows the heartbeat interval
//
// Run: node --test tests/wss_local_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import { connectWss } from "../dist/connection/wss.js";
import { buildWssUrl } from "../dist/connection/url.js";
import { DeviceBlockedError } from "../dist/http/api.js";
import { root } from "../dist/proto/schema.js";

const PushFrame = root.lookupType("WebcastPushFrame");
const noop = () => {};

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

describe("wss local", () => {
  it("L1 onOpen + hb/enter_room, resolves on close", async () => {
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    const received = [];
    wss.on("connection", (sock, req) => {
      assert.match(req.headers.cookie, /^ttwid=abc; sessionid=s$/);
      sock.on("message", (data) => {
        received.push(PushFrame.decode(new Uint8Array(data)).payloadType);
        if (received.length === 2) sock.close();
      });
    });
    const port = await listen(http);
    let opened = 0;
    try {
      await connectWss(`ws://127.0.0.1:${port}/`, "abc", "123", {
        onEvent: noop, onError: noop, onOpen: () => opened++,
      }, new AbortController().signal, { userAgent: "ua", cookies: "sessionid=s" });
      assert.equal(opened, 1);
      assert.deepEqual(received, ["hb", "im_enter_room"]);
    } finally {
      wss.close();
      http.close();
    }
  });

  it("L2 DEVICE_BLOCKED handshake → DeviceBlockedError", async () => {
    const http = createServer();
    http.on("upgrade", (_req, socket) => {
      socket.end("HTTP/1.1 415 Unsupported Media Type\r\nHandshake-Msg: DEVICE_BLOCKED\r\n" +
        "Handshake-Status: 415\r\nContent-Length: 0\r\n\r\n");
    });
    const port = await listen(http);
    let opened = 0;
    try {
      await assert.rejects(
        connectWss(`ws://127.0.0.1:${port}/`, "abc", "123", {
          onEvent: noop, onError: noop, onOpen: () => opened++,
        }, new AbortController().signal, { userAgent: "ua" }),
        DeviceBlockedError,
      );
      assert.equal(opened, 0);
    } finally {
      http.close();
    }
  });

  it("L3 heartbeatMs drives heartbeat cadence", async () => {
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    let heartbeats = 0;
    wss.on("connection", (sock) => {
      sock.on("message", (data) => {
        if (PushFrame.decode(new Uint8Array(data)).payloadType === "hb") heartbeats++;
      });
      setTimeout(() => sock.close(), 300);
    });
    const port = await listen(http);
    try {
      await connectWss(`ws://127.0.0.1:${port}/`, "abc", "123", {
        onEvent: noop, onError: noop,
      }, new AbortController().signal, { userAgent: "ua", heartbeatMs: 50 });
      assert.ok(heartbeats >= 4, `expected ≥4 heartbeats in 300 ms at 50 ms, got ${heartbeats}`);
    } finally {
      wss.close();
      http.close();
    }
  });

  it("L4 URL params: heartbeat_duration, language/region, compress", () => {
    const params = (url) => new URL(url).searchParams;
    assert.equal(params(buildWssUrl("h", "1", "en", "US", true)).get("heartbeat_duration"), "10000");
    const p = params(buildWssUrl("h", "1", "pt", "BR", false, 4_000));
    assert.equal(p.get("heartbeat_duration"), "4000");
    assert.deepEqual([p.get("webcast_language"), p.get("app_language"), p.get("browser_language")], ["pt", "pt", "pt-BR"]);
    assert.equal(p.get("compress"), "");
    assert.equal(params(buildWssUrl("h", "1", "en", "US", true)).get("compress"), "gzip");
  });

  it("L5 needs_ack → ack frame with log_id + internal_ext", async () => {
    const Resp = root.lookupType("WebcastResponse");
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    let ack = null;
    let headers = null;
    wss.on("connection", (sock, req) => {
      headers = req.headers;
      const payload = Resp.encode(Resp.fromObject({ needsAck: true, internalExt: Buffer.from("ext-1") })).finish();
      sock.send(PushFrame.encode(PushFrame.fromObject({ payloadType: "msg", logId: 77, payload })).finish());
      sock.on("message", (data) => {
        const f = PushFrame.decode(new Uint8Array(data));
        if (f.payloadType === "ack") {
          ack = f;
          sock.close();
        }
      });
    });
    const port = await listen(http);
    try {
      await connectWss(`ws://127.0.0.1:${port}/`, "abc", "123", { onEvent: noop, onError: noop },
        new AbortController().signal, { userAgent: "UA-fixed", acceptLanguage: "pt-BR,pt;q=0.9" });
      assert.equal(Number(ack.logId), 77);
      assert.equal(Buffer.from(ack.payload).toString(), "ext-1");
      assert.equal(headers["user-agent"], "UA-fixed");
      assert.equal(headers["accept-language"], "pt-BR,pt;q=0.9");
    } finally {
      wss.close();
      http.close();
    }
  });

  it("L6 stale timeout closes a silent connection", async () => {
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    const port = await listen(http);
    const started = Date.now();
    try {
      await connectWss(`ws://127.0.0.1:${port}/`, "abc", "123",
        { onEvent: noop, onError: noop, staleTimeoutMs: 150 },
        new AbortController().signal, { userAgent: "ua", heartbeatMs: 60_000 });
      const elapsed = Date.now() - started;
      assert.ok(elapsed >= 140 && elapsed < 2_000, `stale close after ${elapsed} ms`);
    } finally {
      wss.close();
      http.close();
    }
  });

  it("L7 abort (disconnect) resolves the session", async () => {
    const http = createServer();
    const wss = new WebSocketServer({ server: http });
    const port = await listen(http);
    const ctl = new AbortController();
    try {
      await connectWss(`ws://127.0.0.1:${port}/`, "abc", "123",
        { onEvent: noop, onError: noop, onOpen: () => setTimeout(() => ctl.abort(), 20) },
        ctl.signal, { userAgent: "ua" });
    } finally {
      wss.close();
      http.close();
    }
  });
});

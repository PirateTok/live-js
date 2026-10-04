// ttwid fetch retry — offline, against a local fake HTTP responder.
//
// T1: no cookie N times, then cookie → succeeds on attempt N+1
// T2: never a cookie → TtwidMissingError after exactly `attempts` requests
// T3: transport error → thrown on the first attempt, no retry
//
// Run: node --test tests/ttwid_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { fetchTTWID, TtwidMissingError, TTWID_FETCH_ATTEMPTS } from "../dist/auth/ttwid.js";

function fakeTikTok(cookieOnRequest) {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push(req.headers["user-agent"]);
    if (seen.length === cookieOnRequest) {
      res.setHeader("Set-Cookie", ["tt_csrf_token=x; Path=/", "ttwid=1%7Cfake%7C123; Path=/; HttpOnly"]);
    }
    res.end("<html></html>");
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}/`, seen, close: () => server.close() });
    });
  });
}

describe("ttwid retry", () => {
  it("T1 missing cookie then cookie → succeeds", async () => {
    const srv = await fakeTikTok(4);
    try {
      const ttwid = await fetchTTWID(2_000, "UA-test", undefined, { url: srv.url, retryDelayMs: 5 });
      assert.equal(ttwid, "1%7Cfake%7C123");
      assert.equal(srv.seen.length, 4);
      assert.deepEqual([...new Set(srv.seen)], ["UA-test"], "same UA on every attempt");
    } finally {
      srv.close();
    }
  });

  it("T2 never a cookie → TtwidMissingError after 8 attempts", async () => {
    const srv = await fakeTikTok(-1);
    try {
      await assert.rejects(
        fetchTTWID(2_000, "UA-test", undefined, { url: srv.url, retryDelayMs: 5 }),
        (err) => err instanceof TtwidMissingError && err.statusCode === 200,
      );
      assert.equal(TTWID_FETCH_ATTEMPTS, 8);
      assert.equal(srv.seen.length, TTWID_FETCH_ATTEMPTS);
    } finally {
      srv.close();
    }
  });

  it("T3 transport error → thrown immediately", async () => {
    const srv = await fakeTikTok(-1);
    srv.close();
    const started = Date.now();
    await assert.rejects(
      fetchTTWID(2_000, "UA-test", undefined, { url: srv.url, retryDelayMs: 1_000 }),
      (err) => !(err instanceof TtwidMissingError),
    );
    assert.ok(Date.now() - started < 1_000, "no retry delay was taken");
  });
});

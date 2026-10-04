// Client lifecycle + ProfileCache — offline.
//
// K1: session opens, then failures exhaust max_retries → connect() resolved,
//     Reconnecting×N, Disconnected exactly once
// K2: no handshake ever → connect() rejects with the last error, Disconnected once
// K3: disconnect() while streaming → Disconnected once, no Reconnecting
// PC1: ProfileCache parses a sigi page from a local origin; second fetch is a cache hit
// PC2: private / not-found profiles are negatively cached
//
// Run: node --test tests/client_profile_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { TikTokLiveClient } from "../dist/client.js";
import { ProfileCache } from "../dist/helpers/profile-cache.js";
import { ProfilePrivateError, ProfileNotFoundError } from "../dist/http/api.js";

function record(client) {
  const log = { connected: 0, reconnecting: [], disconnected: 0 };
  client.on("connected", () => log.connected++);
  client.on("reconnecting", (info) => log.reconnecting.push(info.attempt));
  client.on("disconnected", () => log.disconnected++);
  return log;
}

function fakeDeps(script) {
  return () => ({
    newSession: async () => ({ ttwid: "t", userAgent: "u" }),
    runSession: async (_s, onOpen) => {
      const step = script.shift() ?? "fail";
      if (step === "open-then-fail") {
        onOpen();
        throw new Error("socket hang up");
      }
      if (step === "open-hold") {
        onOpen();
        return new Promise(() => {});
      }
      throw new Error(`handshake refused (${step})`);
    },
    sleep: async () => {},
    now: () => 0,
  });
}

const settle = () => new Promise((r) => setTimeout(r, 20));

describe("client lifecycle", () => {
  it("K1 open then failures → Reconnecting×N, Disconnected once", async () => {
    const client = new TikTokLiveClient("fixture").maxRetries(3);
    const log = record(client);
    const roomId = await client.runSessions("7400", fakeDeps(["open-then-fail"]));
    assert.equal(roomId, "7400");
    await settle();
    assert.equal(log.connected, 1);
    assert.deepEqual(log.reconnecting, [1, 2, 3]);
    assert.equal(log.disconnected, 1);
  });

  it("K2 never opens → rejects with last error, Disconnected once", async () => {
    const client = new TikTokLiveClient("fixture").maxRetries(2);
    const log = record(client);
    await assert.rejects(client.runSessions("7400", fakeDeps([])), /handshake refused/);
    assert.deepEqual(log.reconnecting, [1, 2]);
    assert.equal(log.disconnected, 1);
  });

  it("K3 disconnect() while streaming → Disconnected once", async () => {
    const client = new TikTokLiveClient("fixture").maxRetries(3);
    const log = record(client);
    await client.runSessions("7400", (signal) => {
      const deps = fakeDeps(["open-hold"])(signal);
      const run = deps.runSession;
      deps.runSession = (s, onOpen) => Promise.race([
        run(s, onOpen),
        new Promise((r) => signal.addEventListener("abort", r, { once: true })),
      ]);
      return deps;
    });
    client.disconnect();
    await settle();
    assert.deepEqual(log.reconnecting, []);
    assert.equal(log.disconnected, 1);
  });
});

function sigiPage(userDetail) {
  const blob = JSON.stringify({ __DEFAULT_SCOPE__: { "webapp.user-detail": userDetail } });
  return `<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${blob}</script></html>`;
}

const PAGES = {
  "/@fixture_user": sigiPage({
    statusCode: 0,
    userInfo: {
      user: { id: "6900000000000000002", uniqueId: "fixture_user", nickname: "Fixture", signature: "bio",
        verified: true, privateAccount: false, roomId: "7400", bioLink: { link: "example.invalid" } },
      stats: { followerCount: 1200, followingCount: 3, heartCount: 99, videoCount: 7, friendCount: 1 },
    },
  }),
  "/@private_user": sigiPage({ statusCode: 10222 }),
  "/@ghost_user": sigiPage({ statusCode: 10221 }),
};

describe("ProfileCache", () => {
  it("PC1 + PC2 parse, cache hit, negative cache", async () => {
    const hits = {};
    const server = createServer((req, res) => {
      hits[req.url] = (hits[req.url] ?? 0) + 1;
      if (req.url === "/") {
        res.setHeader("Set-Cookie", "ttwid=pc-ttwid; Path=/");
        res.end("");
        return;
      }
      assert.match(req.headers.cookie, /^ttwid=pc-ttwid/);
      res.end(PAGES[req.url] ?? "not found");
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const cache = new ProfileCache({ baseUrl: `http://127.0.0.1:${server.address().port}`, userAgent: "ua" });
    try {
      const p = await cache.fetch("@Fixture_User");
      assert.equal(p.userId, "6900000000000000002");
      assert.equal(p.nickname, "Fixture");
      assert.equal(p.followerCount, 1200);
      assert.equal(p.bioLink, "example.invalid");
      assert.equal(p.verified, true);

      const again = await cache.fetch("fixture_user");
      assert.equal(again, p);
      assert.equal(cache.cached("FIXTURE_USER"), p);
      assert.equal(hits["/@fixture_user"], 1, "second fetch is a cache hit");

      for (let i = 0; i < 2; i++) {
        await assert.rejects(cache.fetch("private_user"), ProfilePrivateError);
        await assert.rejects(cache.fetch("ghost_user"), ProfileNotFoundError);
      }
      assert.equal(hits["/@private_user"], 1, "private is negatively cached");
      assert.equal(hits["/@ghost_user"], 1, "not-found is negatively cached");
      assert.equal(hits["/"], 1, "ttwid fetched once and reused");
    } finally {
      server.close();
    }
  });
});

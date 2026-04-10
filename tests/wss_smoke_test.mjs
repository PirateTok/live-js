// WSS smoke tests — W1-W7, D1
//
// Connect to a real live room over WSS and wait for specific event types.
// All tests are skipped unless PIRATETOK_LIVE_TEST_USER is set.
// Inherently flaky: quiet streams may not produce all event types within
// the timeout window. That is acceptable.
//
// Gate: PIRATETOK_LIVE_TEST_USER
//
// Run: node --test tests/wss_smoke_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TikTokLiveClient } from "../dist/client.js";
import { EventType } from "../dist/events/types.js";

// --- timeouts (per spec section 5) ---

const AWAIT_TRAFFIC_MS = 90_000;
const AWAIT_CHAT_MS = 120_000;
const AWAIT_GIFT_MS = 180_000;
const AWAIT_LIKE_MS = 120_000;
const AWAIT_JOIN_MS = 150_000;
const AWAIT_FOLLOW_MS = 180_000;
const AWAIT_SUBSCRIPTION_MS = 240_000;

// --- helper: await a WSS event from a live room ---
//
// Creates a client with test config, registers listeners via `registerListeners`,
// starts connect() on a background promise, waits for the latch to be tripped,
// then disconnects and waits for the connect promise to settle.
//
// `registerListeners(client, hit)` — `hit()` counts the event as received.
// Returns true if the event arrived before the timeout, false otherwise.
// Throws if the connect promise rejected before the event arrived.

async function awaitWssEvent(user, awaitMs, registerListeners) {
  let resolve;
  const latch = new Promise((r) => { resolve = r; });
  let hit = false;
  const onHit = () => { if (!hit) { hit = true; resolve(); } };

  let connectError = null;

  const client = new TikTokLiveClient(user)
    .cdnEU()
    .timeout(15_000)
    .maxRetries(5)
    .staleTimeout(45_000);

  registerListeners(client, onHit);

  const connectPromise = client.connect().catch((err) => { connectError = err; });

  const raceResult = await Promise.race([
    latch.then(() => "hit"),
    new Promise((r) => setTimeout(() => r("timeout"), awaitMs)),
  ]);

  if (connectError) {
    client.disconnect();
    await connectPromise;
    throw new Error(`connect() rejected before event arrived: ${connectError}`);
  }

  client.disconnect();

  // Give the connect promise up to 30s to settle after disconnect
  await Promise.race([
    connectPromise,
    new Promise((r) => setTimeout(r, 30_000)),
  ]);

  return raceResult === "hit";
}

describe("wss smoke", { timeout: 300_000 }, () => {
  it("W1 connect_receivesTrafficBeforeTimeout", { timeout: AWAIT_TRAFFIC_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W1: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_TRAFFIC_MS, (client, hit) => {
      client.on(EventType.roomUserSeq, hit);
      client.on(EventType.member, hit);
      client.on(EventType.chat, hit);
      client.on(EventType.like, hit);
      client.on(EventType.control, hit);
    });

    assert.ok(got, `no room traffic within ${AWAIT_TRAFFIC_MS / 1000}s (quiet stream or block)`);
  });

  it("W2 connect_receivesChatBeforeTimeout", { timeout: AWAIT_CHAT_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W2: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_CHAT_MS, (client, hit) => {
      client.on(EventType.chat, (data) => {
        const chatData = data ?? {};
        const chatUser = chatData.user ?? {};
        console.log(
          `[integration test chat] ${chatUser.uniqueId ?? "?"}: ${chatData.content ?? ""}`,
        );
        hit();
      });
    });

    assert.ok(got, `no chat message within ${AWAIT_CHAT_MS / 1000}s (quiet stream or block)`);
  });

  it("W3 connect_receivesGiftBeforeTimeout", { timeout: AWAIT_GIFT_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W3: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_GIFT_MS, (client, hit) => {
      client.on(EventType.gift, (data) => {
        const giftData = data ?? {};
        const gifter = giftData.user ?? {};
        const gift = giftData.gift ?? {};
        console.log(
          `[integration test gift] ${gifter.uniqueId ?? "?"} -> ${gift.name ?? "?"} x${giftData.repeatCount ?? 1} (${gift.diamondCount ?? 0} diamonds each)`,
        );
        hit();
      });
    });

    assert.ok(got, `no gift within ${AWAIT_GIFT_MS / 1000}s (quiet stream or no gifts — try a busier stream)`);
  });

  it("W4 connect_receivesLikeBeforeTimeout", { timeout: AWAIT_LIKE_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W4: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_LIKE_MS, (client, hit) => {
      client.on(EventType.like, (data) => {
        const likeData = data ?? {};
        const liker = likeData.user ?? {};
        console.log(
          `[integration test like] ${liker.uniqueId ?? "?"} count=${likeData.count ?? ""} total=${likeData.total ?? ""}`,
        );
        hit();
      });
    });

    assert.ok(got, `no like within ${AWAIT_LIKE_MS / 1000}s (quiet stream or block)`);
  });

  it("W5 connect_receivesJoinBeforeTimeout", { timeout: AWAIT_JOIN_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W5: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_JOIN_MS, (client, hit) => {
      client.on(EventType.join, (data) => {
        const member = (data ?? {}).user ?? {};
        console.log(`[integration test join] ${member.uniqueId ?? "?"}`);
        hit();
      });
    });

    assert.ok(got, `no join within ${AWAIT_JOIN_MS / 1000}s (try a busier stream)`);
  });

  it("W6 connect_receivesFollowBeforeTimeout", { timeout: AWAIT_FOLLOW_MS + 60_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W6: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_FOLLOW_MS, (client, hit) => {
      client.on(EventType.follow, (data) => {
        const follower = (data ?? {}).user ?? {};
        console.log(`[integration test follow] ${follower.uniqueId ?? "?"}`);
        hit();
      });
    });

    assert.ok(got, `no follow within ${AWAIT_FOLLOW_MS / 1000}s (follows are infrequent — try a growing stream)`);
  });

  // W7 — disabled by default: subscription events are too rare on most streams.
  // Enable manually by removing the early return.
  it("W7 connect_receivesSubscriptionSignalBeforeTimeout [DISABLED]", async () => {
    console.log("SKIP W7: subscription events disabled by default (too rare on most streams)");
    return;

    // To enable: remove the return above and set PIRATETOK_LIVE_TEST_USER.
    // Kept here for completeness — matches Java reference W7.
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP W7: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const got = await awaitWssEvent(user, AWAIT_SUBSCRIPTION_MS, (client, hit) => {
      client.on(EventType.subNotify, () => { console.log("[integration test subscription] subNotify"); hit(); });
      client.on(EventType.subscriptionNotify, () => { console.log("[integration test subscription] subscriptionNotify"); hit(); });
      client.on(EventType.subCapsule, () => { console.log("[integration test subscription] subCapsule"); hit(); });
      client.on(EventType.subPinEvent, () => { console.log("[integration test subscription] subPinEvent"); hit(); });
    });

    assert.ok(got, `no subscription-related event within ${AWAIT_SUBSCRIPTION_MS / 1000}s (need subs/gifts on a sub-enabled stream)`);
  });

  it("D1 disconnect_unblocksConnectPromiseAfterConnected", { timeout: 180_000 }, async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP D1: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    let resolveConnected;
    const connectedLatch = new Promise((r) => { resolveConnected = r; });
    let connectError = null;

    const client = new TikTokLiveClient(user)
      .cdnEU()
      .timeout(15_000)
      .maxRetries(5)
      .staleTimeout(45_000);

    client.on(EventType.connected, () => resolveConnected());

    const connectPromise = client.connect().catch((err) => { connectError = err; });

    // Wait for CONNECTED with 90s timeout
    const connectedResult = await Promise.race([
      connectedLatch.then(() => "connected"),
      new Promise((r) => setTimeout(() => r("timeout"), 90_000)),
    ]);

    if (connectedResult === "timeout") {
      client.disconnect();
      await connectPromise;
      assert.fail("never reached CONNECTED within 90s (offline user or network)");
    }

    assert.equal(connectError, null, `connect promise failed before disconnect: ${connectError}`);

    // Disconnect and measure how long the promise takes to settle
    const t0 = Date.now();
    client.disconnect();

    const joinResult = await Promise.race([
      connectPromise.then(() => "done"),
      new Promise((r) => setTimeout(() => r("timeout"), 20_000)),
    ]);

    const elapsed = Date.now() - t0;

    assert.equal(joinResult, "done", "connect promise should settle after disconnect()");
    assert.ok(elapsed < 18_000, `connect promise should settle within 18s of disconnect (took ${elapsed}ms)`);
    assert.equal(connectError, null, "connect promise must not reject after clean disconnect");
  });
});

// Multi-stream load test — M1
//
// Creates N clients (one per username from PIRATETOK_LIVE_TEST_USERS),
// connects all concurrently, counts chat events for 60 seconds, then
// disconnects all and waits for all promises to settle.
//
// Gate: PIRATETOK_LIVE_TEST_USERS (comma-separated, all must be live)
//
// Run: node --test tests/multi_stream_load_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TikTokLiveClient } from "../dist/client.js";
import { EventType } from "../dist/events/types.js";

describe("multi-stream load", { timeout: 600_000 }, () => {
  it("M1 multipleLiveClients_trackChatForOneMinute", { timeout: 540_000 }, async () => {
    const usersEnv = process.env.PIRATETOK_LIVE_TEST_USERS?.trim();
    if (!usersEnv) {
      console.log("SKIP M1: set PIRATETOK_LIVE_TEST_USERS to comma-separated live TikTok usernames");
      return;
    }

    const users = usersEnv.split(",").map((u) => u.trim()).filter((u) => u.length > 0);
    if (users.length === 0) {
      console.log("SKIP M1: PIRATETOK_LIVE_TEST_USERS is empty after parsing");
      return;
    }

    console.log(`[M1] connecting ${users.length} clients: ${users.join(", ")}`);

    /** Per-channel chat counters */
    const chatCounts = Object.fromEntries(users.map((u) => [u, 0]));
    const connectErrors = [];

    // Track how many clients have reached CONNECTED
    let connectedCount = 0;
    const allConnectedPromises = [];

    const clients = users.map((user) => {
      let resolveConnected;
      const connectedLatch = new Promise((r) => { resolveConnected = r; });
      allConnectedPromises.push(connectedLatch);

      const client = new TikTokLiveClient(user)
        .cdnEU()
        .timeout(15_000)
        .maxRetries(5)
        .staleTimeout(120_000);

      client.on(EventType.connected, () => {
        connectedCount++;
        console.log(`[M1] ${user} CONNECTED (${connectedCount}/${users.length})`);
        resolveConnected();
      });

      client.on(EventType.chat, () => {
        chatCounts[user]++;
      });

      return { user, client, connectedLatch };
    });

    // Start all connect() calls concurrently
    const connectPromises = clients.map(({ user, client }) =>
      client.connect().catch((err) => {
        connectErrors.push({ user, err });
      }),
    );

    // Wait for all clients to reach CONNECTED — 120s timeout
    const allConnectedResult = await Promise.race([
      Promise.all(allConnectedPromises).then(() => "connected"),
      new Promise((r) => setTimeout(() => r("timeout"), 120_000)),
    ]);

    if (allConnectedResult === "timeout") {
      // Disconnect all before asserting to avoid leaking connections
      for (const { client } of clients) {
        client.disconnect();
      }
      await Promise.allSettled(connectPromises);
      assert.fail(
        `not all clients reached CONNECTED within 120s (${connectedCount}/${users.length} connected)`,
      );
    }

    // Live window: listen for 60 seconds
    console.log(`[M1] all ${users.length} clients CONNECTED — listening for 60s`);
    await new Promise((r) => setTimeout(r, 60_000));

    // Disconnect all clients
    for (const { client } of clients) {
      client.disconnect();
    }

    // Wait for all connect promises to settle — 120s timeout
    const settleResult = await Promise.race([
      Promise.allSettled(connectPromises).then(() => "settled"),
      new Promise((r) => setTimeout(() => r("timeout"), 120_000)),
    ]);

    // Log per-channel counts
    console.log("[M1] chat counts:");
    for (const [user, count] of Object.entries(chatCounts)) {
      console.log(`  ${user}: ${count} chat events`);
    }

    assert.equal(
      settleResult,
      "settled",
      "all connect promises must settle within 120s after disconnect",
    );

    assert.equal(
      connectErrors.length,
      0,
      `connect errors: ${connectErrors.map((e) => `${e.user}: ${e.err}`).join("; ")}`,
    );
  });
});

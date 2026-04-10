// API integration tests — H1-H4
//
// Hits real TikTok HTTP endpoints. All tests are skipped unless the relevant
// env var is set. Default `npm test` stays green without network access.
//
// Gates:
//   PIRATETOK_LIVE_TEST_USER         — live username (H1, H4)
//   PIRATETOK_LIVE_TEST_OFFLINE_USER — offline username (H2)
//   PIRATETOK_LIVE_TEST_COOKIES      — "sessionid=xxx; sid_tt=xxx" for 18+ room info (optional in H4)
//   PIRATETOK_LIVE_TEST_HTTP=1       — enables nonexistent-user probe (H3)
//
// Run: node --test tests/api_integration_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkOnline, fetchRoomInfo } from "../dist/http/api.js";
import {
  UserNotFoundError,
  HostNotOnlineError,
} from "../dist/http/api.js";

/** Unlikely to be registered. TikTok must return user-not-found for this probe. */
const SYNTHETIC_NONEXISTENT_USER = "piratetok_js_nf_7a3c9e2f1b8d4a6c0e5f3a2b1d9c8e7";

/** HTTP timeout for all API calls per spec (25s). */
const TIMEOUT_MS = 25_000;

describe("api integration", () => {
  it("H1 checkOnline_liveUser_returnsRoomId", async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP H1: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const result = await checkOnline(user, TIMEOUT_MS);
    assert.ok(result.roomId, "roomId must be non-empty");
    assert.notEqual(result.roomId, "0", "roomId must not be '0'");
  });

  it("H2 checkOnline_offlineUser_throwsHostNotOnline", async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_OFFLINE_USER?.trim();
    if (!user) {
      console.log("SKIP H2: set PIRATETOK_LIVE_TEST_OFFLINE_USER to an offline TikTok username");
      return;
    }

    await assert.rejects(
      () => checkOnline(user, TIMEOUT_MS),
      (err) => {
        assert.ok(
          err instanceof HostNotOnlineError,
          `expected HostNotOnlineError, got ${err.name}: ${err.message}`,
        );
        return true;
      },
    );
  });

  it("H3 checkOnline_nonexistentUser_throwsUserNotFound", async () => {
    const gate = process.env.PIRATETOK_LIVE_TEST_HTTP?.trim();
    if (gate !== "1" && gate !== "true" && gate !== "yes") {
      console.log("SKIP H3: set PIRATETOK_LIVE_TEST_HTTP=1 to call TikTok user/room for not-found probe");
      return;
    }

    await assert.rejects(
      () => checkOnline(SYNTHETIC_NONEXISTENT_USER, TIMEOUT_MS),
      (err) => {
        assert.ok(
          err instanceof UserNotFoundError,
          `expected UserNotFoundError, got ${err.name}: ${err.message}`,
        );
        assert.equal(err.username, SYNTHETIC_NONEXISTENT_USER);
        return true;
      },
    );
  });

  it("H4 fetchRoomInfo_liveRoom_returnsRoomInfo", async () => {
    const user = process.env.PIRATETOK_LIVE_TEST_USER?.trim();
    if (!user) {
      console.log("SKIP H4: set PIRATETOK_LIVE_TEST_USER to a live TikTok username");
      return;
    }

    const room = await checkOnline(user, TIMEOUT_MS);
    const cookies = process.env.PIRATETOK_LIVE_TEST_COOKIES?.trim() ?? "";
    const info = await fetchRoomInfo(room.roomId, TIMEOUT_MS, cookies);

    assert.ok(info !== null && info !== undefined, "fetchRoomInfo must return room info");
    assert.ok(typeof info.viewers === "number", "viewers must be a number");
    assert.ok(info.viewers >= 0, "viewers must be >= 0");
  });
});

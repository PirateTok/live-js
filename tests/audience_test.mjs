// online_audience parsing + top_viewers — offline.
//
// A1: status 0 → totals + viewers, rank without user skipped, id_str/id fallback
// A2: status 20003 → SessionRequiredError
// A3: other status → InvalidResponseError carrying code + message
// A4: empty body / missing status_code → InvalidResponseError
// V1: hand-built RoomUserSeq with contributors out of order → topViewers() by rank
//
// Run: node --test tests/audience_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { parseRoomAudience } from "../dist/http/audience.js";
import { SessionRequiredError, InvalidResponseError } from "../dist/http/api.js";
import { topViewers } from "../dist/events/top-viewers.js";
import { decode } from "../dist/events/router.js";
import { root } from "../dist/proto/schema.js";
import "../dist/proto/messages.js";

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), "utf-8");

describe("fetchRoomAudience parsing", () => {
  it("A1 status 0 → roster", () => {
    const body = fixture("online_audience_ok");
    const aud = parseRoomAudience(body, 200);
    assert.equal(aud.total, 57);
    assert.equal(aud.anonymous, 12);
    assert.equal(aud.rawJson, body);
    assert.equal(aud.viewers.length, 2, "rank without user is skipped");
    assert.deepEqual(aud.viewers[0], {
      rank: 1, score: 900,
      userId: "7000000000000000001",
      username: "fixture_viewer_one",
      nickname: "Fixture One",
      secUid: "MS4wLjABAAAAfixture1",
      avatarUrl: "https://p16.example.invalid/one.webp",
      followerCount: 321,
      verified: true, isFollower: true, isFollowing: false, isSubscriber: true,
    });
    assert.equal(aud.viewers[1].userId, "4242", "falls back to numeric id");
    assert.equal(aud.viewers[1].avatarUrl, null);
    assert.equal(aud.viewers[1].followerCount, 0);
  });

  it("A2 status 20003 → SessionRequiredError", () => {
    assert.throws(
      () => parseRoomAudience(fixture("online_audience_session_required"), 200),
      (err) => err instanceof SessionRequiredError && /session cookies/.test(err.message),
    );
  });

  it("A3 other status → InvalidResponseError", () => {
    assert.throws(
      () => parseRoomAudience(fixture("online_audience_error"), 200),
      (err) => err instanceof InvalidResponseError
        && err.message.includes("status_code=10011 param error"),
    );
  });

  it("A4 empty body / no status_code → InvalidResponseError", () => {
    assert.throws(() => parseRoomAudience("", 403),
      (err) => err instanceof InvalidResponseError && err.message.includes("http 403"));
    assert.throws(() => parseRoomAudience("{\"data\":{}}", 200),
      (err) => err instanceof InvalidResponseError && err.message.includes("no status_code"));
  });
});

describe("topViewers", () => {
  it("V1 RoomUserSeq contributors sorted by rank, userless skipped", () => {
    const Seq = root.lookupType("WebcastRoomUserSeqMessage");
    const payload = Seq.encode(Seq.fromObject({
      ranksList: [
        { score: 30, rank: 3, user: { id: 33, nickname: "third" } },
        { score: 99, rank: 1, user: { id: 11, nickname: "first" } },
        { score: 70, rank: 0 },
        { score: 60, rank: 2, user: { id: 22, nickname: "second" } },
      ],
      viewerCount: 1234,
      totalUser: 5678,
    })).finish();

    const [evt] = decode("WebcastRoomUserSeqMessage", payload);
    assert.equal(evt.type, "roomUserSeq");
    const top = topViewers(evt.data);
    assert.deepEqual(top.map((c) => c.user.nickname), ["first", "second", "third"]);
    assert.deepEqual(top.map((c) => Number(c.rank)), [1, 2, 3]);
    assert.equal(Number(evt.data.viewerCount), 1234);
    assert.equal(Number(evt.data.totalUser), 5678);
  });
});

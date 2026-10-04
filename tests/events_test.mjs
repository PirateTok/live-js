// Event decode surface — offline, hand-built protobuf payloads.
//
// E1: gift helpers isCombo / isStreakOver / diamondTotal (injected + exported)
// E2: sub-routing fires raw + convenience events
// E3: unmapped method → unknown { method, payload } with raw bytes preserved
// E4: enriched User (follow_info, fans_club, badge_list, is_follower, ...)
//
// Run: node --test tests/events_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { root } from "../dist/proto/schema.js";
import "../dist/proto/messages.js";
import { decode } from "../dist/events/router.js";
import { isComboGift, isStreakOver, diamondTotal } from "../dist/events/gift.js";

function encode(typeName, obj) {
  const T = root.lookupType(typeName);
  return T.encode(T.fromObject(obj)).finish();
}

describe("event decode", () => {
  it("E1 gift helpers", () => {
    const streaking = decode("WebcastGiftMessage", encode("WebcastGiftMessage", {
      giftId: 5655, repeatCount: 3, repeatEnd: 0, gift: { type: 1, diamondCount: 5 },
    }))[0].data;
    assert.deepEqual([streaking.isCombo, streaking.isStreakOver, streaking.diamondTotal], [true, false, 15]);

    const ended = decode("WebcastGiftMessage", encode("WebcastGiftMessage", {
      giftId: 5655, repeatCount: 7, repeatEnd: 1, gift: { type: 1, diamondCount: 5 },
    }))[0].data;
    assert.deepEqual([ended.isCombo, ended.isStreakOver, ended.diamondTotal], [true, true, 35]);

    const single = decode("WebcastGiftMessage", encode("WebcastGiftMessage", {
      giftId: 1, gift: { type: 2, diamondCount: 100 },
    }))[0].data;
    assert.deepEqual([isComboGift(single), isStreakOver(single), diamondTotal(single)], [false, true, 100]);
  });

  it("E2 sub-routing fires raw + convenience", () => {
    const routed = (method, type, action) => decode(method, encode(method, { action })).map((e) => e.type);
    assert.deepEqual(routed("WebcastSocialMessage", "social", 1), ["social", "follow"]);
    assert.deepEqual(routed("WebcastSocialMessage", "social", 3), ["social", "share"]);
    assert.deepEqual(routed("WebcastMemberMessage", "member", 1), ["member", "join"]);
    assert.deepEqual(routed("WebcastControlMessage", "control", 3), ["control", "liveEnded"]);
    assert.deepEqual(routed("WebcastControlMessage", "control", 1), ["control"]);
  });

  it("E3 unknown method keeps method + raw payload", () => {
    const payload = new Uint8Array([8, 1, 18, 2, 104, 105]);
    const [evt] = decode("WebcastKaraokeQueueMessage", payload);
    assert.equal(evt.type, "unknown");
    assert.equal(evt.data.method, "WebcastKaraokeQueueMessage");
    assert.deepEqual(evt.data.payload, payload);
  });

  it("E4 enriched User", () => {
    const [evt] = decode("WebcastChatMessage", encode("WebcastChatMessage", {
      content: "hi",
      user: {
        id: 42, nickname: "fixture",
        followInfo: { followingCount: 3, followerCount: 900, followStatus: 2 },
        fansClub: { data: { clubName: "crew", level: 7 } },
        badgeList: [
          { badgeScene: 8, logExtra: { level: "25" } },
          { badgeScene: 1 },
        ],
        isFollower: true, isFollowing: false, isSubscribe: true,
      },
    }));
    const u = evt.data.user;
    assert.equal(evt.type, "chat");
    assert.equal(Number(u.followInfo.followerCount), 900);
    assert.deepEqual([u.fansClub.data.clubName, u.fansClub.data.level], ["crew", 7]);
    const gifter = u.badgeList.find((b) => b.badgeScene === 8);
    assert.equal(gifter.logExtra.level, "25");
    assert.ok(u.badgeList.some((b) => b.badgeScene === 1), "moderator badge");
    assert.deepEqual([u.isFollower, u.isSubscribe], [true, true]);
  });
});

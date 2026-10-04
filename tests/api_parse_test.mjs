// HTTP response mapping + decode coverage — offline.
//
// C1: check_online → roomId + anchorId
// C2: check_online error mapping (UserNotFound / HostNotOnline / ApiError / TikTokBlocked)
// R1: room info → title/viewers/FLV URLs; 4003110 → AgeRestricted; other → TikTokApiError
// D1: all 64 Tier A + Tier B methods decode to typed events (none fall to unknown)
// U1: random UA pool (6 UAs, Firefox + Chrome)
//
// Run: node --test tests/api_parse_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseCheckOnline, roomInfoFromJson, checkRoomInfoStatus,
  UserNotFoundError, HostNotOnlineError, TikTokApiError, TikTokBlockedError, AgeRestrictedError,
} from "../dist/http/api.js";
import { decode } from "../dist/events/router.js";
import { randomUa } from "../dist/http/ua.js";

const live = (over = {}) => JSON.stringify({
  statusCode: 0,
  data: { user: { id: "6900000000000000001", roomId: "7400000000000000001", status: 2 }, liveRoom: { status: 2 }, ...over },
});

describe("check_online mapping", () => {
  it("C1 live → roomId + anchorId", () => {
    assert.deepEqual(parseCheckOnline(live(), 200, "u"),
      { roomId: "7400000000000000001", anchorId: "6900000000000000001" });
  });

  it("C2 error mapping", () => {
    assert.throws(() => parseCheckOnline(JSON.stringify({ statusCode: 19881007 }), 200, "ghost"),
      (e) => e instanceof UserNotFoundError && e.username === "ghost");
    assert.throws(() => parseCheckOnline(live({ user: { id: "1", roomId: "0" } }), 200, "off"), HostNotOnlineError);
    assert.throws(() => parseCheckOnline(live({ user: { id: "1", roomId: "5", status: 4 }, liveRoom: { status: 4 } }), 200, "off"),
      HostNotOnlineError);
    assert.throws(() => parseCheckOnline(JSON.stringify({ statusCode: 10222 }), 200, "u"),
      (e) => e instanceof TikTokApiError && e.code === 10222);
    assert.throws(() => parseCheckOnline("<html>challenge</html>", 200, "u"), TikTokBlockedError);
    assert.throws(() => parseCheckOnline(live(), 429, "u"), (e) => e instanceof TikTokBlockedError && e.statusCode === 429);
  });
});

describe("room info mapping", () => {
  it("R1 fields, FLV URLs, AgeRestricted, ApiError", () => {
    const info = roomInfoFromJson(checkRoomInfoStatus({
      status_code: 0,
      data: {
        title: "fixture stream", user_count: 321, stats: { like_count: 9000, total_user: 4000 },
        stream_url: { flv_pull_url: { FULL_HD1: "o.flv", HD1: "hd.flv", SD1: "sd.flv", SD2: "ld.flv" } },
      },
    }));
    assert.deepEqual(info, {
      title: "fixture stream", viewers: 321, likes: 9000, totalUser: 4000,
      streamUrl: { flvOrigin: "o.flv", flvHd: "hd.flv", flvSd: "sd.flv", flvLd: "ld.flv", flvAudio: "" },
    });
    assert.throws(() => checkRoomInfoStatus({ status_code: 4003110 }),
      (e) => e instanceof AgeRestrictedError && /18\+/.test(e.message) && /cookies/.test(e.message));
    assert.throws(() => checkRoomInfoStatus({ status_code: 1 }), TikTokApiError);
  });
});

// CLAUDE.md §5 Tier A (39) + Tier B (25). RoomVerifyMessage is the wire method name.
const TIER_A = [
  "WebcastChatMessage", "WebcastGiftMessage", "WebcastLikeMessage", "WebcastMemberMessage",
  "WebcastSocialMessage", "WebcastRoomUserSeqMessage", "WebcastControlMessage",
  "WebcastLiveIntroMessage", "WebcastRoomMessage", "WebcastCaptionMessage", "WebcastGoalUpdateMessage",
  "WebcastImDeleteMessage", "WebcastRankUpdateMessage", "WebcastPollMessage", "WebcastEnvelopeMessage",
  "WebcastRoomPinMessage", "WebcastUnauthorizedMemberMessage", "WebcastLinkMicMethod", "WebcastLinkMicBattle",
  "WebcastLinkMicArmies", "WebcastLinkMessage", "WebcastLinkLayerMessage", "WebcastLinkMicLayoutStateMessage",
  "WebcastGiftPanelUpdateMessage", "WebcastInRoomBannerMessage", "WebcastGuideMessage", "WebcastEmoteChatMessage",
  "WebcastQuestionNewMessage", "WebcastSubNotifyMessage", "WebcastBarrageMessage", "WebcastHourlyRankMessage",
  "WebcastMsgDetectMessage", "WebcastLinkMicFanTicketMethod", "RoomVerifyMessage",
  "WebcastOecLiveShoppingMessage", "WebcastGiftBroadcastMessage", "WebcastRankTextMessage",
  "WebcastGiftDynamicRestrictionMessage", "WebcastViewerPicksUpdateMessage",
];
const TIER_B = [
  "WebcastAccessControlMessage", "WebcastAccessRecallMessage", "WebcastAlertBoxAuditResultMessage",
  "WebcastBindingGiftMessage", "WebcastBoostCardMessage", "WebcastBottomMessage", "WebcastGameRankNotifyMessage",
  "WebcastGiftPromptMessage", "WebcastLinkStateMessage", "WebcastLinkMicBattlePunishFinish",
  "WebcastLinkmicBattleTaskMessage", "WebcastMarqueeAnnouncementMessage", "WebcastNoticeMessage",
  "WebcastNotifyMessage", "WebcastPartnershipDropsUpdateMessage", "WebcastPartnershipGameOfflineMessage",
  "WebcastPartnershipPunishMessage", "WebcastPerceptionMessage", "WebcastSpeakerMessage", "WebcastSubCapsuleMessage",
  "WebcastSubPinEventMessage", "WebcastSubscriptionNotifyMessage", "WebcastToastMessage", "WebcastSystemMessage",
  "WebcastLiveGameIntroMessage",
];

describe("decode coverage", () => {
  it("D1 Tier A + B are typed", () => {
    assert.equal(TIER_A.length, 39);
    assert.equal(TIER_B.length, 25);
    const untyped = [...TIER_A, ...TIER_B].filter((m) => decode(m, new Uint8Array())[0].type === "unknown");
    assert.deepEqual(untyped, []);
  });
});

describe("user agent", () => {
  it("U1 random pool", () => {
    const seen = new Set(Array.from({ length: 500 }, () => randomUa()));
    assert.equal(seen.size, 6);
    assert.ok([...seen].some((ua) => ua.includes("Firefox")) && [...seen].some((ua) => ua.includes("Chrome")));
  });
});

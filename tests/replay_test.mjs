// Replay test — reads a capture file, processes it through the full decode
// pipeline, and asserts every value matches the manifest JSON.
//
// Skips if testdata is not available. Set PIRATETOK_TESTDATA env var or
// place captures in ../live-testdata/.
//
// Run:  node --test tests/replay_test.mjs

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { root } from "../dist/proto/schema.js";
import "../dist/proto/messages.js";
import { decode } from "../dist/events/router.js";
import { LikeAccumulator } from "../dist/helpers/like-accumulator.js";
import { GiftStreakTracker } from "../dist/helpers/gift-streak.js";
import { decompressIfGzipped } from "../dist/connection/frames.js";

// --- proto types (looked up once) ---

const PushFrame = root.lookupType("WebcastPushFrame");
const WebcastResponse = root.lookupType("WebcastResponse");
const WebcastLikeMessage = root.lookupType("WebcastLikeMessage");
const WebcastGiftMessage = root.lookupType("WebcastGiftMessage");

// --- event type name mapping (JS camelCase -> manifest PascalCase) ---

const EVENT_NAME_MAP = {
  connected: "Connected",
  reconnecting: "Reconnecting",
  disconnected: "Disconnected",
  chat: "Chat",
  gift: "Gift",
  like: "Like",
  member: "Member",
  social: "Social",
  follow: "Follow",
  share: "Share",
  join: "Join",
  control: "Control",
  liveEnded: "LiveEnded",
  roomUserSeq: "RoomUserSeq",
  caption: "Caption",
  liveIntro: "LiveIntro",
  roomMessage: "RoomMessage",
  goalUpdate: "GoalUpdate",
  imDelete: "ImDelete",
  rankUpdate: "RankUpdate",
  poll: "Poll",
  envelope: "Envelope",
  roomPin: "RoomPin",
  unauthorizedMember: "UnauthorizedMember",
  linkMicMethod: "LinkMicMethod",
  linkMicBattle: "LinkMicBattle",
  linkMicArmies: "LinkMicArmies",
  linkMessage: "LinkMessage",
  linkLayer: "LinkLayer",
  linkMicLayoutState: "LinkMicLayoutState",
  giftPanelUpdate: "GiftPanelUpdate",
  inRoomBanner: "InRoomBanner",
  guide: "Guide",
  emoteChat: "EmoteChat",
  questionNew: "QuestionNew",
  subNotify: "SubNotify",
  barrage: "Barrage",
  hourlyRank: "HourlyRank",
  msgDetect: "MsgDetect",
  linkMicFanTicket: "LinkMicFanTicket",
  roomVerify: "RoomVerify",
  oecLiveShopping: "OecLiveShopping",
  giftBroadcast: "GiftBroadcast",
  rankText: "RankText",
  giftDynamicRestriction: "GiftDynamicRestriction",
  viewerPicksUpdate: "ViewerPicksUpdate",
  accessControl: "AccessControl",
  accessRecall: "AccessRecall",
  alertBoxAuditResult: "AlertBoxAuditResult",
  bindingGift: "BindingGift",
  boostCard: "BoostCard",
  bottom: "BottomMessage",
  gameRankNotify: "GameRankNotify",
  giftPrompt: "GiftPrompt",
  linkState: "LinkState",
  linkMicBattlePunishFinish: "LinkMicBattlePunishFinish",
  linkmicBattleTask: "LinkmicBattleTask",
  marqueeAnnouncement: "MarqueeAnnouncement",
  notice: "Notice",
  notify: "Notify",
  partnershipDropsUpdate: "PartnershipDropsUpdate",
  partnershipGameOffline: "PartnershipGameOffline",
  partnershipPunish: "PartnershipPunish",
  perception: "Perception",
  speaker: "Speaker",
  subCapsule: "SubCapsule",
  subPinEvent: "SubPinEvent",
  subscriptionNotify: "SubscriptionNotify",
  toast: "Toast",
  system: "SystemMessage",
  liveGameIntro: "LiveGameIntro",
  unknown: "Unknown",
};

// --- testdata location ---

const __dirname = dirname(fileURLToPath(import.meta.url));

function findTestdataPaths(captureName, manifestName) {
  const candidates = [];

  const envDir = process.env.PIRATETOK_TESTDATA;
  if (envDir) {
    candidates.push({
      capture: resolve(envDir, "captures", `${captureName}.bin`),
      manifest: resolve(envDir, "manifests", `${manifestName}.json`),
    });
  }

  // testdata/ in repo root
  candidates.push({
    capture: resolve(__dirname, "..", "testdata", "captures", `${captureName}.bin`),
    manifest: resolve(__dirname, "..", "testdata", "manifests", `${manifestName}.json`),
  });

  for (const c of candidates) {
    if (existsSync(c.capture) && existsSync(c.manifest)) {
      return c;
    }
  }
  return null;
}

// --- frame reader ---

function readCapture(path) {
  const data = readFileSync(path);
  const frames = [];
  let pos = 0;
  while (pos + 4 <= data.length) {
    const len = data.readUInt32LE(pos);
    pos += 4;
    if (pos + len > data.length) {
      throw new Error(`truncated frame at offset ${pos - 4}`);
    }
    frames.push(data.subarray(pos, pos + len));
    pos += len;
  }
  return frames;
}

// --- number coercion (handles Long objects, strings, numbers) ---

function toNum(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  if (v && typeof v === "object" && typeof v.toNumber === "function") {
    return v.toNumber();
  }
  return 0;
}

// --- manifest event type name ---

function manifestEventName(jsType) {
  return EVENT_NAME_MAP[jsType] || jsType;
}

// --- replay engine ---

function replay(frames) {
  const result = {
    frameCount: frames.length,
    messageCount: 0,
    eventCount: 0,
    decodeFailures: 0,
    decompressFailures: 0,
    payloadTypes: {},
    messageTypes: {},
    eventTypes: {},
    followCount: 0,
    shareCount: 0,
    joinCount: 0,
    liveEndedCount: 0,
    unknownTypes: {},
    likeEvents: [],
    giftGroups: {},
    comboCount: 0,
    nonComboCount: 0,
    streakFinals: 0,
    negativeDeltas: 0,
  };

  const likeAcc = new LikeAccumulator();
  const giftTracker = new GiftStreakTracker();

  for (const raw of frames) {
    let frame;
    try {
      frame = PushFrame.decode(raw);
    } catch {
      result.decodeFailures++;
      continue;
    }

    const payloadType = frame.payloadType;
    result.payloadTypes[payloadType] = (result.payloadTypes[payloadType] || 0) + 1;

    if (payloadType !== "msg") continue;

    let decompressed;
    try {
      decompressed = decompressIfGzipped(new Uint8Array(frame.payload));
    } catch {
      result.decompressFailures++;
      continue;
    }

    let response;
    try {
      response = WebcastResponse.decode(decompressed);
    } catch {
      result.decodeFailures++;
      continue;
    }

    const messages = response.messages || [];
    for (const msg of messages) {
      result.messageCount++;
      const method = msg.method;
      result.messageTypes[method] = (result.messageTypes[method] || 0) + 1;

      // Route through the same event mapper as the live connection
      const events = decode(method, msg.payload);
      for (const evt of events) {
        result.eventCount++;
        const ename = manifestEventName(evt.type);
        result.eventTypes[ename] = (result.eventTypes[ename] || 0) + 1;

        if (evt.type === "follow") result.followCount++;
        if (evt.type === "share") result.shareCount++;
        if (evt.type === "join") result.joinCount++;
        if (evt.type === "liveEnded") result.liveEndedCount++;
        if (evt.type === "unknown") {
          const unknownData = evt.data;
          const unknownMethod = unknownData.method;
          result.unknownTypes[unknownMethod] =
            (result.unknownTypes[unknownMethod] || 0) + 1;
        }
      }

      // Like accumulator — decode raw proto for numeric fields
      if (method === "WebcastLikeMessage") {
        try {
          const likeMsg = WebcastLikeMessage.decode(msg.payload);
          const wireCount = toNum(likeMsg.count);
          const wireTotal = toNum(likeMsg.total);
          const stats = likeAcc.process({ count: wireCount, total: wireTotal });
          result.likeEvents.push({
            wireCount,
            wireTotal,
            accTotal: stats.totalLikeCount,
            accumulated: stats.accumulatedCount,
            wentBackwards: stats.wentBackwards,
          });
        } catch {
          // decode failure already counted above
        }
      }

      // Gift streak tracker — decode raw proto for numeric fields
      if (method === "WebcastGiftMessage") {
        try {
          const giftMsg = WebcastGiftMessage.decode(msg.payload);
          const giftId = toNum(giftMsg.giftId);
          const repeatCount = toNum(giftMsg.repeatCount);
          const repeatEnd = toNum(giftMsg.repeatEnd);
          const groupId = toNum(giftMsg.groupId);
          const gift = giftMsg.gift || {};
          const giftType = toNum(gift.type);
          const diamondCount = toNum(gift.diamondCount);
          const isCombo = giftType === 1;
          const isFinal = isCombo ? repeatEnd === 1 : true;

          if (isCombo) {
            result.comboCount++;
          } else {
            result.nonComboCount++;
          }

          const streakData = giftTracker.process({
            groupId,
            repeatCount,
            repeatEnd,
            gift: { type: giftType, diamondCount },
          });

          if (streakData.isFinal) result.streakFinals++;
          if (streakData.eventGiftCount < 0) result.negativeDeltas++;

          const key = groupId.toString();
          if (!result.giftGroups[key]) result.giftGroups[key] = [];
          result.giftGroups[key].push({
            giftId,
            repeatCount,
            delta: streakData.eventGiftCount,
            isFinal: streakData.isFinal,
            diamondTotal: streakData.totalDiamondCount,
          });
        } catch {
          // decode failure already counted above
        }
      }
    }
  }

  return result;
}

// --- assertions ---

function assertReplay(name, r, m) {
  assert.equal(r.frameCount, m.frame_count, `${name}: frame_count`);
  assert.equal(r.messageCount, m.message_count, `${name}: message_count`);
  assert.equal(r.eventCount, m.event_count, `${name}: event_count`);
  assert.equal(r.decodeFailures, m.decode_failures, `${name}: decode_failures`);
  assert.equal(r.decompressFailures, m.decompress_failures,
    `${name}: decompress_failures`);

  assert.deepEqual(r.payloadTypes, m.payload_types, `${name}: payload_types`);
  assert.deepEqual(r.messageTypes, m.message_types, `${name}: message_types`);
  assert.deepEqual(r.eventTypes, m.event_types, `${name}: event_types`);

  assert.equal(r.followCount, m.sub_routed.follow, `${name}: sub_routed.follow`);
  assert.equal(r.shareCount, m.sub_routed.share, `${name}: sub_routed.share`);
  assert.equal(r.joinCount, m.sub_routed.join, `${name}: sub_routed.join`);
  assert.equal(r.liveEndedCount, m.sub_routed.live_ended,
    `${name}: sub_routed.live_ended`);

  assert.deepEqual(r.unknownTypes, m.unknown_types, `${name}: unknown_types`);

  // --- like accumulator ---
  const ml = m.like_accumulator;
  assert.equal(r.likeEvents.length, ml.event_count,
    `${name}: like event_count`);

  const backwards = r.likeEvents.filter((e) => e.wentBackwards).length;
  assert.equal(backwards, ml.backwards_jumps, `${name}: like backwards_jumps`);

  if (r.likeEvents.length > 0) {
    const last = r.likeEvents[r.likeEvents.length - 1];
    assert.equal(last.accTotal, ml.final_max_total,
      `${name}: like final_max_total`);
    assert.equal(last.accumulated, ml.final_accumulated,
      `${name}: like final_accumulated`);
  }

  let accMono = true;
  let accumMono = true;
  for (let i = 1; i < r.likeEvents.length; i++) {
    if (r.likeEvents[i].accTotal < r.likeEvents[i - 1].accTotal) {
      accMono = false;
    }
    if (r.likeEvents[i].accumulated < r.likeEvents[i - 1].accumulated) {
      accumMono = false;
    }
  }
  assert.equal(accMono, ml.acc_total_monotonic,
    `${name}: like acc_total_monotonic`);
  assert.equal(accumMono, ml.accumulated_monotonic,
    `${name}: like accumulated_monotonic`);

  // Event-by-event
  assert.equal(r.likeEvents.length, ml.events.length,
    `${name}: like events length`);
  for (let i = 0; i < r.likeEvents.length; i++) {
    const got = r.likeEvents[i];
    const exp = ml.events[i];
    assert.equal(got.wireCount, exp.wire_count,
      `${name}: like[${i}].wire_count`);
    assert.equal(got.wireTotal, exp.wire_total,
      `${name}: like[${i}].wire_total`);
    assert.equal(got.accTotal, exp.acc_total,
      `${name}: like[${i}].acc_total`);
    assert.equal(got.accumulated, exp.accumulated,
      `${name}: like[${i}].accumulated`);
    assert.equal(got.wentBackwards, exp.went_backwards,
      `${name}: like[${i}].went_backwards`);
  }

  // --- gift streaks ---
  const mg = m.gift_streaks;
  assert.equal(r.comboCount + r.nonComboCount, mg.event_count,
    `${name}: gift event_count`);
  assert.equal(r.comboCount, mg.combo_count, `${name}: gift combo_count`);
  assert.equal(r.nonComboCount, mg.non_combo_count,
    `${name}: gift non_combo_count`);
  assert.equal(r.streakFinals, mg.streak_finals,
    `${name}: gift streak_finals`);
  assert.equal(r.negativeDeltas, mg.negative_deltas,
    `${name}: gift negative_deltas`);

  // Group-by-group
  const gotKeys = Object.keys(r.giftGroups).sort();
  const expKeys = Object.keys(mg.groups).sort();
  assert.deepEqual(gotKeys, expKeys, `${name}: gift group keys`);

  for (const gid of expKeys) {
    const gotEvts = r.giftGroups[gid];
    const expEvts = mg.groups[gid];
    assert.equal(gotEvts.length, expEvts.length,
      `${name}: gift group ${gid} length`);
    for (let i = 0; i < expEvts.length; i++) {
      const g = gotEvts[i];
      const e = expEvts[i];
      assert.equal(g.giftId, e.gift_id,
        `${name}: gift[${gid}][${i}].gift_id`);
      assert.equal(g.repeatCount, e.repeat_count,
        `${name}: gift[${gid}][${i}].repeat_count`);
      assert.equal(g.delta, e.delta,
        `${name}: gift[${gid}][${i}].delta`);
      assert.equal(g.isFinal, e.is_final,
        `${name}: gift[${gid}][${i}].is_final`);
      assert.equal(g.diamondTotal, e.diamond_total,
        `${name}: gift[${gid}][${i}].diamond_total`);
    }
  }
}

// --- test runner ---

function runCaptureTestVariant(captureName, manifestName) {
  const paths = findTestdataPaths(captureName, manifestName);
  if (!paths) {
    console.log(
      `SKIP ${captureName}: no testdata (set PIRATETOK_TESTDATA or clone live-testdata)`
    );
    return;
  }

  const manifest = JSON.parse(readFileSync(paths.manifest, "utf-8"));
  const frames = readCapture(paths.capture);
  const result = replay(frames);
  assertReplay(captureName, result, manifest);
}

function runCaptureTest(name) {
  runCaptureTestVariant(name, name);
}

function runCaptureTestRaw(name) {
  runCaptureTestVariant(`${name}_raw`, name);
}

// --- tests ---

describe("replay", () => {
  it("replay_calvinterest6", () => {
    runCaptureTest("calvinterest6");
  });

  it("replay_happyhappygaltv", () => {
    runCaptureTest("happyhappygaltv");
  });

  it("replay_fox4newsdallasfortworth", () => {
    runCaptureTest("fox4newsdallasfortworth");
  });

  // Raw (uncompressed) capture variants — same manifests, gzip stripped from payloads

  it("replay_calvinterest6_raw", () => {
    runCaptureTestRaw("calvinterest6");
  });

  it("replay_happyhappygaltv_raw", () => {
    runCaptureTestRaw("happyhappygaltv");
  });

  it("replay_fox4newsdallasfortworth_raw", () => {
    runCaptureTestRaw("fox4newsdallasfortworth");
  });
});

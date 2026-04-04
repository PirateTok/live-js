import { root } from "../proto/schema.js";
import "../proto/messages.js"; // side-effect: registers all types
import { EventType, TikTokEvent } from "./types.js";
import type { EventTypeName } from "./types.js";

type ProtoMessage = { toJSON(): Record<string, unknown> };

const METHOD_MAP: Record<string, EventTypeName> = {
  WebcastChatMessage: EventType.chat,
  WebcastGiftMessage: EventType.gift,
  WebcastLikeMessage: EventType.like,
  WebcastMemberMessage: EventType.member,
  WebcastSocialMessage: EventType.social,
  WebcastRoomUserSeqMessage: EventType.roomUserSeq,
  WebcastControlMessage: EventType.control,
  WebcastLiveIntroMessage: EventType.liveIntro,
  WebcastRoomMessage: EventType.roomMessage,
  WebcastCaptionMessage: EventType.caption,
  WebcastGoalUpdateMessage: EventType.goalUpdate,
  WebcastImDeleteMessage: EventType.imDelete,
  WebcastRankUpdateMessage: EventType.rankUpdate,
  WebcastPollMessage: EventType.poll,
  WebcastEnvelopeMessage: EventType.envelope,
  WebcastRoomPinMessage: EventType.roomPin,
  WebcastUnauthorizedMemberMessage: EventType.unauthorizedMember,
  WebcastLinkMicMethod: EventType.linkMicMethod,
  WebcastLinkMicBattle: EventType.linkMicBattle,
  WebcastLinkMicArmies: EventType.linkMicArmies,
  WebcastLinkMessage: EventType.linkMessage,
  WebcastLinkLayerMessage: EventType.linkLayer,
  WebcastLinkMicLayoutStateMessage: EventType.linkMicLayoutState,
  WebcastGiftPanelUpdateMessage: EventType.giftPanelUpdate,
  WebcastInRoomBannerMessage: EventType.inRoomBanner,
  WebcastGuideMessage: EventType.guide,
  WebcastEmoteChatMessage: EventType.emoteChat,
  WebcastQuestionNewMessage: EventType.questionNew,
  WebcastSubNotifyMessage: EventType.subNotify,
  WebcastBarrageMessage: EventType.barrage,
  WebcastHourlyRankMessage: EventType.hourlyRank,
  WebcastMsgDetectMessage: EventType.msgDetect,
  WebcastLinkMicFanTicketMethod: EventType.linkMicFanTicket,
  RoomVerifyMessage: EventType.roomVerify,
  WebcastOecLiveShoppingMessage: EventType.oecLiveShopping,
  WebcastGiftBroadcastMessage: EventType.giftBroadcast,
  WebcastRankTextMessage: EventType.rankText,
  WebcastGiftDynamicRestrictionMessage: EventType.giftDynamicRestriction,
  WebcastViewerPicksUpdateMessage: EventType.viewerPicksUpdate,
  WebcastAccessControlMessage: EventType.accessControl,
  WebcastAccessRecallMessage: EventType.accessRecall,
  WebcastAlertBoxAuditResultMessage: EventType.alertBoxAuditResult,
  WebcastBindingGiftMessage: EventType.bindingGift,
  WebcastBoostCardMessage: EventType.boostCard,
  WebcastBottomMessage: EventType.bottom,
  WebcastGameRankNotifyMessage: EventType.gameRankNotify,
  WebcastGiftPromptMessage: EventType.giftPrompt,
  WebcastLinkStateMessage: EventType.linkState,
  WebcastLinkMicBattlePunishFinish: EventType.linkMicBattlePunishFinish,
  WebcastLinkmicBattleTaskMessage: EventType.linkmicBattleTask,
  WebcastMarqueeAnnouncementMessage: EventType.marqueeAnnouncement,
  WebcastNoticeMessage: EventType.notice,
  WebcastNotifyMessage: EventType.notify,
  WebcastPartnershipDropsUpdateMessage: EventType.partnershipDropsUpdate,
  WebcastPartnershipGameOfflineMessage: EventType.partnershipGameOffline,
  WebcastPartnershipPunishMessage: EventType.partnershipPunish,
  WebcastPerceptionMessage: EventType.perception,
  WebcastSpeakerMessage: EventType.speaker,
  WebcastSubCapsuleMessage: EventType.subCapsule,
  WebcastSubPinEventMessage: EventType.subPinEvent,
  WebcastSubscriptionNotifyMessage: EventType.subscriptionNotify,
  WebcastToastMessage: EventType.toast,
  WebcastSystemMessage: EventType.system,
  WebcastLiveGameIntroMessage: EventType.liveGameIntro,
};

function tryDecode(method: string, payload: Uint8Array): ProtoMessage | null {
  try {
    const msgType = root.lookupType(method);
    return msgType.decode(payload) as ProtoMessage;
  } catch {
    return null;
  }
}

export function decode(method: string, payload: Uint8Array): TikTokEvent[] {
  const eventName = METHOD_MAP[method];
  if (!eventName) {
    return [{ type: EventType.unknown, data: { method, payload } }];
  }

  const decoded = tryDecode(method, payload);
  if (!decoded) {
    return [{ type: EventType.unknown, data: { method, payload } }];
  }

  const data = decoded.toJSON();
  const events: TikTokEvent[] = [{ type: eventName, data }];

  // Sub-routing
  if (method === "WebcastSocialMessage") {
    const action = Number(data.action ?? 0);
    if (action === 1) events.push({ type: EventType.follow, data });
    if (action >= 2 && action <= 5) events.push({ type: EventType.share, data });
  } else if (method === "WebcastMemberMessage") {
    const action = Number(data.action ?? 0);
    if (action === 1) events.push({ type: EventType.join, data });
  } else if (method === "WebcastControlMessage") {
    const action = Number(data.action ?? 0);
    if (action === 3) events.push({ type: EventType.liveEnded, data });
  }

  return events;
}

import protobuf from "protobufjs";
import { root } from "./schema.js";

const { Type, Field } = protobuf;

// === Niche + extended events ===

root.add(new Type("WebcastRankUpdateMessage")
  .add(new Field("common", 1, "Common")).add(new Field("groupType", 3, "int64")));

root.add(new Type("WebcastPollMessage")
  .add(new Field("common", 1, "Common")).add(new Field("pollId", 3, "int64"))
  .add(new Field("pollKind", 7, "int32")));

root.add(new Type("WebcastEnvelopeMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastRoomPinMessage")
  .add(new Field("common", 1, "Common")).add(new Field("pinnedMessage", 2, "bytes"))
  .add(new Field("originalMsgType", 30, "string")).add(new Field("timestamp", 31, "uint64")));

root.add(new Type("WebcastUnauthorizedMemberMessage")
  .add(new Field("common", 1, "Common")).add(new Field("action", 2, "int32"))
  .add(new Field("nickName", 4, "string")));

root.add(new Type("WebcastLinkMicMethod")
  .add(new Field("common", 1, "Common")).add(new Field("accessKey", 3, "string"))
  .add(new Field("anchorLinkmicId", 4, "int64")).add(new Field("channelId", 8, "int64")));

root.add(new Type("WebcastLinkMicBattle")
  .add(new Field("common", 1, "Common")).add(new Field("id", 2, "uint64")));

root.add(new Type("WebcastLinkMicArmies")
  .add(new Field("common", 1, "Common")).add(new Field("id", 2, "uint64"))
  .add(new Field("timeStamp1", 5, "uint64")).add(new Field("timeStamp2", 6, "uint64")));

root.add(new Type("WebcastLinkMessage")
  .add(new Field("common", 1, "Common")).add(new Field("linkerId", 3, "int64")));

root.add(new Type("WebcastLinkLayerMessage")
  .add(new Field("common", 1, "Common")).add(new Field("channelId", 3, "int64")));

root.add(new Type("WebcastLinkMicLayoutStateMessage")
  .add(new Field("commonRaw", 1, "bytes")).add(new Field("roomId", 2, "int64"))
  .add(new Field("layoutState", 3, "int32")).add(new Field("layoutKey", 6, "string")));

root.add(new Type("WebcastGiftPanelUpdateMessage")
  .add(new Field("commonRaw", 1, "bytes")).add(new Field("roomId", 2, "int64"))
  .add(new Field("panelTsOrVersion", 3, "int64")));

root.add(new Type("WebcastInRoomBannerMessage")
  .add(new Field("common", 1, "Common")).add(new Field("json", 2, "string")));

root.add(new Type("WebcastGuideMessage")
  .add(new Field("commonRaw", 1, "bytes")).add(new Field("guideType", 2, "int32"))
  .add(new Field("durationMs", 5, "int64")).add(new Field("scene", 7, "string")));

root.add(new Type("WebcastEmoteChatMessage")
  .add(new Field("common", 1, "Common")).add(new Field("user", 2, "User"))
  .add(new Field("emoteList", 3, "Emote", "repeated")));

root.add(new Type("WebcastQuestionNewMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastSubNotifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("user", 2, "User"))
  .add(new Field("subMonth", 4, "int64")));

root.add(new Type("WebcastBarrageMessage")
  .add(new Field("common", 1, "Common")).add(new Field("content", 5, "Text"))
  .add(new Field("duration", 6, "int32")));

root.add(new Type("WebcastHourlyRankMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastMsgDetectMessage")
  .add(new Field("common", 1, "Common")).add(new Field("detectType", 2, "int32"))
  .add(new Field("fromRegion", 6, "string")));

root.add(new Type("WebcastLinkMicFanTicketMethod")
  .add(new Field("common", 1, "Common")));

root.add(new Type("RoomVerifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("action", 2, "int32"))
  .add(new Field("content", 3, "string")).add(new Field("closeRoom", 5, "bool")));

root.add(new Type("WebcastOecLiveShoppingMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastGiftBroadcastMessage")
  .add(new Field("common", 1, "Common")).add(new Field("broadcastDataBlob", 2, "bytes")));

root.add(new Type("WebcastRankTextMessage")
  .add(new Field("common", 1, "Common")).add(new Field("scene", 2, "int32")));

root.add(new Type("WebcastGiftDynamicRestrictionMessage")
  .add(new Field("commonRaw", 1, "bytes")).add(new Field("restrictionBlob", 2, "bytes")));

root.add(new Type("WebcastViewerPicksUpdateMessage")
  .add(new Field("commonRaw", 1, "bytes")).add(new Field("updateType", 2, "int32")));

// === Secondary events ===

root.add(new Type("WebcastAccessControlMessage")
  .add(new Field("common", 1, "Common")).add(new Field("captchaBlob", 2, "bytes")));

root.add(new Type("WebcastAccessRecallMessage")
  .add(new Field("common", 1, "Common")).add(new Field("status", 2, "int32"))
  .add(new Field("duration", 3, "int64")).add(new Field("endTime", 4, "int64")));

root.add(new Type("WebcastAlertBoxAuditResultMessage")
  .add(new Field("common", 1, "Common")).add(new Field("userId", 2, "int64"))
  .add(new Field("scene", 5, "int32")));

root.add(new Type("WebcastBindingGiftMessage")
  .add(new Field("giftMessageBlob", 1, "bytes")).add(new Field("common", 2, "Common")));

root.add(new Type("WebcastBoostCardMessage")
  .add(new Field("common", 1, "Common")).add(new Field("cardsBlob", 2, "bytes")));

root.add(new Type("WebcastBottomMessage")
  .add(new Field("common", 1, "Common")).add(new Field("content", 2, "string"))
  .add(new Field("showType", 3, "int32")).add(new Field("duration", 5, "int64")));

root.add(new Type("WebcastGameRankNotifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("msgType", 2, "int32"))
  .add(new Field("notifyText", 3, "string")));

root.add(new Type("WebcastGiftPromptMessage")
  .add(new Field("common", 1, "Common")).add(new Field("title", 2, "string"))
  .add(new Field("body", 3, "string")));

root.add(new Type("WebcastLinkStateMessage")
  .add(new Field("common", 1, "Common")).add(new Field("channelId", 2, "int64"))
  .add(new Field("scene", 3, "int32")).add(new Field("version", 4, "int32")));

root.add(new Type("WebcastLinkMicBattlePunishFinish")
  .add(new Field("common", 1, "Common")).add(new Field("id1", 2, "uint64"))
  .add(new Field("timestamp", 3, "uint64")));

root.add(new Type("WebcastLinkmicBattleTaskMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastMarqueeAnnouncementMessage")
  .add(new Field("common", 1, "Common")).add(new Field("messageScene", 2, "int32")));

root.add(new Type("WebcastNoticeMessage")
  .add(new Field("common", 1, "Common")).add(new Field("content", 2, "string"))
  .add(new Field("noticeType", 3, "int32")));

root.add(new Type("WebcastNotifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("schema", 2, "string"))
  .add(new Field("notifyType", 3, "int32")).add(new Field("contentStr", 4, "string")));

root.add(new Type("WebcastPartnershipDropsUpdateMessage")
  .add(new Field("common", 1, "Common")).add(new Field("changeMode", 2, "int32")));

root.add(new Type("WebcastPartnershipGameOfflineMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastPartnershipPunishMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastPerceptionMessage")
  .add(new Field("common", 1, "Common")).add(new Field("dialogBlob", 2, "bytes"))
  .add(new Field("endTime", 4, "int64")));

root.add(new Type("WebcastSpeakerMessage")
  .add(new Field("common", 1, "Common")));

root.add(new Type("WebcastSubCapsuleMessage")
  .add(new Field("common", 1, "Common")).add(new Field("description", 2, "string"))
  .add(new Field("btnName", 3, "string")).add(new Field("btnUrl", 4, "string")));

root.add(new Type("WebcastSubPinEventMessage")
  .add(new Field("common", 1, "Common")).add(new Field("actionType", 2, "int32"))
  .add(new Field("operatorUserId", 4, "int64")));

root.add(new Type("WebcastSubscriptionNotifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("user", 2, "User"))
  .add(new Field("exhibitionType", 3, "int32")));

root.add(new Type("WebcastToastMessage")
  .add(new Field("common", 1, "Common")).add(new Field("displayDurationMs", 2, "int64"))
  .add(new Field("delayDisplayDurationMs", 3, "int64")));

root.add(new Type("WebcastSystemMessage")
  .add(new Field("common", 1, "Common")).add(new Field("message", 2, "string")));

root.add(new Type("WebcastLiveGameIntroMessage")
  .add(new Field("common", 1, "Common")).add(new Field("gameText", 2, "Text")));

export { root as protoRoot };

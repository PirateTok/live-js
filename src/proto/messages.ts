import protobuf from "protobufjs";
import { root } from "./schema.js";

const { Type, Field } = protobuf;

// === Niche / extended events ===

root.add(new Type("WebcastRankUpdate")
  .add(new Field("rankType", 1, "int64")).add(new Field("ownerRank", 2, "int64"))
  .add(new Field("showEntranceAnimation", 5, "bool")).add(new Field("countdown", 6, "int64"))
  .add(new Field("relatedTabRankType", 8, "int64")).add(new Field("requestFirstShowType", 9, "int64"))
  .add(new Field("supportedVersion", 10, "int64")).add(new Field("ownerOnRank", 11, "bool")));

root.add(new Type("WebcastRankTabInfo")
  .add(new Field("rankType", 1, "int64")).add(new Field("title", 2, "string"))
  .add(new Field("listLynxType", 4, "int64")));

root.add(new Type("WebcastRankUpdateMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("updatesList", 2, "WebcastRankUpdate", "repeated"))
  .add(new Field("groupType", 3, "int64"))
  .add(new Field("priority", 5, "int64"))
  .add(new Field("tabsList", 6, "WebcastRankTabInfo", "repeated"))
  .add(new Field("isAnimationLoopPlay", 7, "bool"))
  .add(new Field("animationLoopForOff", 8, "bool")));

root.add(new Type("WebcastPollMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("messageType", 2, "int32"))
  .add(new Field("pollId", 3, "int64"))
  .add(new Field("startContentBlob", 4, "bytes"))
  .add(new Field("endContentBlob", 5, "bytes"))
  .add(new Field("updateContentBlob", 6, "bytes"))
  .add(new Field("pollKind", 7, "int32")));

root.add(new Type("EnvelopeInfo")
  .add(new Field("envelopeId", 1, "string"))
  .add(new Field("businessType", 2, "int32"))
  .add(new Field("envelopeIdc", 3, "string"))
  .add(new Field("sendUserName", 4, "string"))
  .add(new Field("diamondCount", 5, "int32"))
  .add(new Field("peopleCount", 6, "int32"))
  .add(new Field("unpackAt", 7, "int32"))
  .add(new Field("sendUserId", 8, "string"))
  .add(new Field("createAt", 10, "string"))
  .add(new Field("followShowStatus", 12, "int32"))
  .add(new Field("skinId", 13, "int32")));

root.add(new Type("WebcastEnvelopeMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("envelopeInfo", 2, "EnvelopeInfo"))
  .add(new Field("display", 3, "int32")));

root.add(new Type("WebcastRoomPinMessage")
  .add(new Field("common", 1, "Common")).add(new Field("pinnedMessage", 2, "bytes"))
  .add(new Field("originalMsgType", 30, "string")).add(new Field("timestamp", 31, "uint64")));

root.add(new Type("WebcastUnauthorizedMemberMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("action", 2, "int32"))
  .add(new Field("nickNamePrefix", 3, "Text"))
  .add(new Field("nickName", 4, "string"))
  .add(new Field("enterText", 5, "Text")));

root.add(new Type("WebcastLinkMicMethod")
  .add(new Field("common", 1, "Common"))
  .add(new Field("messageType", 2, "int32"))
  .add(new Field("userId", 5, "int64"))
  .add(new Field("channelId", 8, "int64"))
  .add(new Field("toUserId", 21, "int64"))
  .add(new Field("startTimeMs", 26, "int64"))
  .add(new Field("anchorLinkMicIdStr", 37, "string"))
  .add(new Field("rivalAnchorId", 38, "int64"))
  .add(new Field("rivalLinkmicIdStr", 40, "string")));

root.add(new Type("WebcastLinkMicBattle")
  .add(new Field("common", 1, "Common"))
  .add(new Field("battleId", 2, "int64"))
  .add(new Field("action", 4, "int32")));

root.add(new Type("WebcastLinkMicArmies")
  .add(new Field("common", 1, "Common"))
  .add(new Field("battleId", 2, "int64"))
  .add(new Field("channelId", 4, "int64"))
  .add(new Field("battleStatus", 7, "int32"))
  .add(new Field("fromUserId", 8, "int64"))
  .add(new Field("giftId", 9, "int64"))
  .add(new Field("giftCount", 10, "int32"))
  .add(new Field("totalDiamondCount", 12, "int32"))
  .add(new Field("repeatCount", 13, "int32"))
  .add(new Field("triggerCriticalStrike", 15, "bool")));

root.add(new Type("WebcastLinkMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("messageType", 2, "int32"))
  .add(new Field("linkerId", 3, "int64"))
  .add(new Field("scene", 4, "int32"))
  .add(new Field("listChangeContentBlob", 20, "bytes")));

root.add(new Type("WebcastLinkLayerMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("messageType", 2, "int32"))
  .add(new Field("channelId", 3, "int64"))
  .add(new Field("scene", 4, "int32"))
  .add(new Field("source", 5, "string"))
  .add(new Field("centerizedIdc", 6, "string"))
  .add(new Field("rtcRoomId", 7, "int64"))
  .add(new Field("groupChangeBlob", 118, "bytes"))
  .add(new Field("businessBlob", 200, "bytes")));

root.add(new Type("WebcastLinkMicLayoutStateMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("roomId", 2, "int64"))
  .add(new Field("layoutState", 3, "int32"))
  .add(new Field("layoutKey", 6, "string")));

root.add(new Type("WebcastGiftPanelUpdateMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("roomId", 2, "int64"))
  .add(new Field("panelTsOrVersion", 3, "int64"))
  .add(new Field("panelBlob", 10, "bytes"))
  .add(new Field("giftListBlob", 11, "bytes"))
  .add(new Field("vaultBlob", 12, "bytes")));

root.add(new Type("WebcastInRoomBannerMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("rawDataEntries", 2, "bytes", "repeated"))
  .add(new Field("position", 3, "int32"))
  .add(new Field("actionType", 4, "int32")));

root.add(new Type("WebcastGuideMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("guideType", 2, "int32"))
  .add(new Field("durationMs", 5, "int64"))
  .add(new Field("scene", 7, "string")));

root.add(new Type("WebcastEmoteChatMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("user", 2, "User"))
  .add(new Field("emoteList", 3, "EmoteData", "repeated"))
  .add(new Field("msgFilter", 4, "MsgFilter"))
  .add(new Field("userIdentity", 5, "UserIdentity")));

root.add(new Type("QuestionDetails")
  .add(new Field("questionId", 1, "int64"))
  .add(new Field("questionText", 2, "string"))
  .add(new Field("answerStatus", 3, "int32"))
  .add(new Field("createTime", 4, "int64"))
  .add(new Field("user", 5, "User")));

root.add(new Type("WebcastQuestionNewMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("details", 2, "QuestionDetails")));

root.add(new Type("WebcastSubNotifyMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("sender", 2, "User"))
  .add(new Field("exhibitionType", 3, "int32"))
  .add(new Field("subMonth", 4, "int32"))
  .add(new Field("subscribeType", 5, "int32"))
  .add(new Field("oldSubscribeStatus", 6, "int32"))
  .add(new Field("userSubscribeStatus", 7, "int32"))
  .add(new Field("subscribingStatus", 8, "int32"))
  .add(new Field("changeType", 9, "int32"))
  .add(new Field("upgradeCount", 10, "int64"))
  .add(new Field("user", 11, "User")));

root.add(new Type("WebcastBarrageMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("eventBlob", 2, "bytes"))
  .add(new Field("msgType", 3, "int32"))
  .add(new Field("duration", 6, "int64"))
  .add(new Field("displayConfig", 9, "int32"))
  .add(new Field("galleryGiftId", 10, "int64"))
  .add(new Field("schema", 22, "string"))
  .add(new Field("subType", 23, "string")));

root.add(new Type("WebcastHourlyRankMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("rankContainerBlob", 2, "bytes"))
  .add(new Field("data2", 3, "uint32")));

root.add(new Type("MsgDetectTriggerCondition")
  .add(new Field("uplinkDetectHttp", 1, "bool"))
  .add(new Field("uplinkDetectWebSocket", 2, "bool"))
  .add(new Field("detectP2pMsg", 3, "bool"))
  .add(new Field("detectRoomMsg", 4, "bool"))
  .add(new Field("httpOptimize", 5, "bool")));

root.add(new Type("MsgDetectTimeInfo")
  .add(new Field("clientStartMs", 1, "int64"))
  .add(new Field("apiRecvTimeMs", 2, "int64"))
  .add(new Field("apiSendToGoimMs", 3, "int64")));

root.add(new Type("WebcastMsgDetectMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("detectType", 2, "int32"))
  .add(new Field("triggerCondition", 3, "MsgDetectTriggerCondition"))
  .add(new Field("timeInfo", 4, "MsgDetectTimeInfo"))
  .add(new Field("triggerBy", 5, "int32"))
  .add(new Field("fromRegion", 6, "string")));

root.add(new Type("WebcastLinkMicFanTicketMethod")
  .add(new Field("common", 1, "Common"))
  .add(new Field("fanTicketRoomNoticeBlob", 2, "bytes")));

root.add(new Type("RoomVerifyMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("action", 2, "int32"))
  .add(new Field("content", 3, "string"))
  .add(new Field("noticeType", 4, "int32"))
  .add(new Field("closeRoom", 5, "bool")));

root.add(new Type("WebcastOecLiveShoppingMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("shoppingDataBlob", 2, "bytes")));

root.add(new Type("WebcastGiftBroadcastMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("broadcastDataBlob", 2, "bytes")));

root.add(new Type("WebcastRankTextMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("scene", 2, "int32"))
  .add(new Field("ownerIdxBeforeUpdate", 3, "int64"))
  .add(new Field("ownerIdxAfterUpdate", 4, "int64"))
  .add(new Field("selfGetBadgeMsg", 5, "string"))
  .add(new Field("otherGetBadgeMsg", 6, "string"))
  .add(new Field("curUserId", 7, "int64")));

root.add(new Type("WebcastGiftDynamicRestrictionMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("restrictionBlob", 2, "bytes")));

root.add(new Type("WebcastViewerPicksUpdateMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("updateType", 2, "int32"))
  .add(new Field("picksBlob", 3, "bytes")));

// === Secondary events ===

root.add(new Type("WebcastSystemMessage")
  .add(new Field("common", 1, "Common")).add(new Field("message", 2, "string")));

root.add(new Type("WebcastLiveGameIntroMessage")
  .add(new Field("common", 1, "Common")).add(new Field("gameDataBlob", 2, "bytes")));

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
  .add(new Field("common", 1, "Common")).add(new Field("id1", 2, "int64"))
  .add(new Field("timestamp", 3, "int64")));

root.add(new Type("WebcastLinkmicBattleTaskMessage")
  .add(new Field("common", 1, "Common")).add(new Field("taskDataBlob", 2, "bytes")));

root.add(new Type("WebcastMarqueeAnnouncementMessage")
  .add(new Field("common", 1, "Common")).add(new Field("messageScene", 2, "int32"))
  .add(new Field("entityListBlob", 3, "bytes")));

root.add(new Type("WebcastNoticeMessage")
  .add(new Field("common", 1, "Common")).add(new Field("content", 2, "string"))
  .add(new Field("noticeType", 3, "int32")));

root.add(new Type("WebcastNotifyMessage")
  .add(new Field("common", 1, "Common")).add(new Field("schema", 2, "string"))
  .add(new Field("notifyType", 3, "int32")).add(new Field("contentStr", 4, "string")));

root.add(new Type("WebcastPartnershipDropsUpdateMessage")
  .add(new Field("common", 1, "Common")).add(new Field("changeMode", 2, "int32")));

root.add(new Type("WebcastPartnershipGameOfflineMessage")
  .add(new Field("common", 1, "Common")).add(new Field("offlineGameListBlob", 2, "bytes")));

root.add(new Type("WebcastPartnershipPunishMessage")
  .add(new Field("common", 1, "Common")).add(new Field("punishInfoBlob", 2, "bytes")));

root.add(new Type("WebcastPerceptionMessage")
  .add(new Field("common", 1, "Common")).add(new Field("dialogBlob", 2, "bytes"))
  .add(new Field("endTime", 4, "int64")));

root.add(new Type("WebcastSpeakerMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("user", 2, "User"))
  .add(new Field("displayText", 3, "Text"))
  .add(new Field("triggerType", 4, "int32")));

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
  .add(new Field("common", 1, "Common"))
  .add(new Field("displayDurationMs", 2, "int64"))
  .add(new Field("delayDisplayDurationMs", 3, "int64"))
  .add(new Field("toastText", 4, "string"))
  .add(new Field("buttonText", 5, "string"))
  .add(new Field("buttonSchema", 6, "string")));

export { root as protoRoot };

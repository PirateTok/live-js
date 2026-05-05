import protobuf from "protobufjs";

const { Root, Type, Field, MapField } = protobuf;

export const root = new Root();

// === Frame types ===

const WebcastPushFrame = new Type("WebcastPushFrame")
  .add(new Field("seqId", 1, "uint64"))
  .add(new Field("logId", 2, "uint64"))
  .add(new Field("service", 3, "uint64"))
  .add(new Field("method", 4, "uint64"))
  .add(new MapField("headers", 5, "string", "string"))
  .add(new Field("payloadEncoding", 6, "string"))
  .add(new Field("payloadType", 7, "string"))
  .add(new Field("payload", 8, "bytes"));

const ResponseMessage = new Type("ResponseMessage")
  .add(new Field("method", 1, "string"))
  .add(new Field("payload", 2, "bytes"))
  .add(new Field("msgId", 3, "int64"))
  .add(new Field("msgType", 4, "int32"))
  .add(new Field("offset", 5, "int64"))
  .add(new Field("isHistory", 6, "bool"));

const WebcastResponse = new Type("WebcastResponse")
  .add(new Field("messages", 1, "ResponseMessage", "repeated"))
  .add(new Field("cursor", 2, "string"))
  .add(new Field("fetchInterval", 3, "int64"))
  .add(new Field("now", 4, "int64"))
  .add(new Field("internalExt", 5, "bytes"))
  .add(new Field("fetchType", 6, "int32"))
  .add(new MapField("routeParamsMap", 7, "string", "string"))
  .add(new Field("heartBeatDuration", 8, "int64"))
  .add(new Field("needsAck", 9, "bool"))
  .add(new Field("pushServer", 10, "string"))
  .add(new Field("isFirst", 11, "bool"));

const HeartbeatMessage = new Type("HeartbeatMessage")
  .add(new Field("roomId", 1, "uint64"));

const WebcastImEnterRoomMessage = new Type("WebcastImEnterRoomMessage")
  .add(new Field("roomId", 1, "int64"))
  .add(new Field("roomTag", 2, "string"))
  .add(new Field("liveRegion", 3, "string"))
  .add(new Field("liveId", 4, "int64"))
  .add(new Field("identity", 5, "string"))
  .add(new Field("cursor", 6, "string"))
  .add(new Field("accountType", 7, "int64"))
  .add(new Field("enterUniqueId", 8, "int64"))
  .add(new Field("filterWelcomeMsg", 9, "string"));

root.add(WebcastPushFrame);
root.add(ResponseMessage);
root.add(WebcastResponse);
root.add(HeartbeatMessage);
root.add(WebcastImEnterRoomMessage);

// === Image / Text / Format ===

const ImageContent = new Type("ImageContent")
  .add(new Field("name", 1, "string"))
  .add(new Field("fontColor", 2, "string"))
  .add(new Field("level", 3, "int64"));

const Image = new Type("Image")
  .add(new Field("urlList", 1, "string", "repeated"))
  .add(new Field("uri", 2, "string"))
  .add(new Field("height", 3, "int32"))
  .add(new Field("width", 4, "int32"))
  .add(new Field("avgColor", 5, "string"))
  .add(new Field("imageType", 6, "int32"))
  .add(new Field("schema", 7, "string"))
  .add(new Field("content", 8, "ImageContent"))
  .add(new Field("isAnimated", 9, "bool"));

const TextFormat = new Type("TextFormat")
  .add(new Field("color", 1, "string"))
  .add(new Field("bold", 2, "bool"))
  .add(new Field("italic", 3, "bool"))
  .add(new Field("weight", 4, "int32"))
  .add(new Field("italicAngle", 5, "int32"))
  .add(new Field("fontSize", 6, "int32"))
  .add(new Field("useHighLightColor", 7, "bool"))
  .add(new Field("useRemoteColor", 8, "bool"));

const PatternRef = new Type("PatternRef")
  .add(new Field("key", 1, "string"))
  .add(new Field("defaultPattern", 2, "string"));

const TextPieceUser = new Type("TextPieceUser")
  .add(new Field("user", 1, "User"))
  .add(new Field("withColon", 2, "bool"));

const TextPieceGift = new Type("TextPieceGift")
  .add(new Field("giftId", 1, "int32"))
  .add(new Field("nameRef", 2, "PatternRef"))
  .add(new Field("showType", 3, "int32"))
  .add(new Field("colorId", 4, "int64"));

const TextPiece = new Type("TextPiece")
  .add(new Field("type", 1, "int32"))
  .add(new Field("format", 2, "TextFormat"))
  .add(new Field("stringValue", 11, "string"))
  .add(new Field("userValue", 21, "TextPieceUser"))
  .add(new Field("giftValue", 22, "TextPieceGift"))
  .add(new Field("patternRefValue", 24, "PatternRef"));

const Text = new Type("Text")
  .add(new Field("key", 1, "string"))
  .add(new Field("defaultPattern", 2, "string"))
  .add(new Field("defaultFormat", 3, "TextFormat"))
  .add(new Field("pieces", 4, "TextPiece", "repeated"));

// === Common ===

const Common = new Type("Common")
  .add(new Field("method", 1, "string"))
  .add(new Field("msgId", 2, "int64"))
  .add(new Field("roomId", 3, "int64"))
  .add(new Field("createTime", 4, "int64"))
  .add(new Field("monitor", 5, "int32"))
  .add(new Field("isShowMsg", 6, "bool"))
  .add(new Field("describe", 7, "string"))
  .add(new Field("displayText", 8, "Text"))
  .add(new Field("foldType", 9, "int64"))
  .add(new Field("anchorFoldType", 10, "int64"))
  .add(new Field("priorityScore", 11, "int64"))
  .add(new Field("logId", 12, "string"))
  .add(new Field("msgProcessFilterK", 13, "string"))
  .add(new Field("msgProcessFilterV", 14, "string"))
  .add(new Field("fromIdc", 15, "string"))
  .add(new Field("toIdc", 16, "string"))
  .add(new Field("filterMsgTags", 17, "string", "repeated"))
  .add(new Field("anchorPriorityScore", 21, "int64"))
  .add(new Field("roomMessageHeatLevel", 22, "int64"))
  .add(new Field("foldTypeForWeb", 23, "int64"))
  .add(new Field("anchorFoldTypeForWeb", 24, "int64"))
  .add(new Field("clientSendTime", 25, "int64"))
  .add(new Field("dispatchStrategy", 26, "int32"));

const UserIdentity = new Type("UserIdentity")
  .add(new Field("isGiftGiverOfAnchor", 1, "bool"))
  .add(new Field("isSubscriberOfAnchor", 2, "bool"))
  .add(new Field("isMutualFollowingWithAnchor", 3, "bool"))
  .add(new Field("isFollowerOfAnchor", 4, "bool"))
  .add(new Field("isModeratorOfAnchor", 5, "bool"))
  .add(new Field("isAnchor", 6, "bool"));

// === Badge sub-types ===

const PrivilegeLogExtra = new Type("PrivilegeLogExtra")
  .add(new Field("dataVersion", 1, "string"))
  .add(new Field("privilegeId", 2, "string"))
  .add(new Field("privilegeVersion", 3, "string"))
  .add(new Field("privilegeOrderId", 4, "string"))
  .add(new Field("level", 5, "string"));

const ImageBadge = new Type("ImageBadge")
  .add(new Field("badgeDisplayType", 1, "int32"))
  .add(new Field("image", 2, "Image"));

const TextBadge = new Type("TextBadge")
  .add(new Field("badgeDisplayType", 1, "int32"))
  .add(new Field("key", 2, "string"))
  .add(new Field("defaultPattern", 3, "string"))
  .add(new Field("pieces", 4, "string", "repeated"));

const StringBadge = new Type("StringBadge")
  .add(new Field("badgeDisplayType", 1, "int32"))
  .add(new Field("strValue", 2, "string"));

const CombineBadgeBackground = new Type("CombineBadgeBackground")
  .add(new Field("image", 1, "Image"))
  .add(new Field("backgroundColorCode", 2, "string"))
  .add(new Field("borderColorCode", 3, "string"));

const FontStyle = new Type("FontStyle")
  .add(new Field("fontSize", 1, "int32"))
  .add(new Field("fontWidth", 2, "int32"))
  .add(new Field("fontColor", 3, "string"))
  .add(new Field("borderColor", 4, "string"));

// Used inside CombineBadge.text — distinct from TextBadge (no leading enum)
const BadgeText = new Type("BadgeText")
  .add(new Field("key", 1, "string"))
  .add(new Field("defaultPattern", 2, "string"))
  .add(new Field("pieces", 3, "string", "repeated"));

const CombineBadge = new Type("CombineBadge")
  .add(new Field("badgeDisplayType", 1, "int32"))
  .add(new Field("icon", 2, "Image"))
  .add(new Field("text", 3, "BadgeText"))
  .add(new Field("strValue", 4, "string"))
  .add(new Field("fontStyle", 6, "FontStyle"))
  .add(new Field("background", 11, "CombineBadgeBackground"))
  .add(new Field("backgroundDarkMode", 12, "CombineBadgeBackground"))
  .add(new Field("iconAutoMirrored", 13, "bool"))
  .add(new Field("bgAutoMirrored", 14, "bool"))
  .add(new Field("publicScreenShowStyle", 15, "int32"))
  .add(new Field("personalCardShowStyle", 16, "int32"))
  .add(new Field("rankListOnlineAudienceShowStyle", 17, "int32"))
  .add(new Field("multiGuestShowStyle", 18, "int32"));

// badge_scene: ADMIN=1, SUBSCRIBER=4, RANK_LIST=6, USER_GRADE=8, FANS=10
const BadgeStruct = new Type("BadgeStruct")
  .add(new Field("displayType", 1, "int32"))
  .add(new Field("priorityType", 2, "int32"))
  .add(new Field("badgeScene", 3, "int32"))
  .add(new Field("position", 4, "int32"))
  .add(new Field("displayStatus", 5, "int32"))
  .add(new Field("greyedByClient", 6, "int64"))
  .add(new Field("exhibitionType", 7, "int32"))
  .add(new Field("schemaUrl", 10, "string"))
  .add(new Field("display", 11, "bool"))
  .add(new Field("logExtra", 12, "PrivilegeLogExtra"))
  .add(new Field("imageBadge", 20, "ImageBadge"))
  .add(new Field("textBadge", 21, "TextBadge"))
  .add(new Field("stringBadge", 22, "StringBadge"))
  .add(new Field("combineBadge", 23, "CombineBadge"))
  .add(new Field("isCustomized", 24, "bool"));

// === Follow / FansClub / Subscribe ===

const FollowInfo = new Type("FollowInfo")
  .add(new Field("followingCount", 1, "int64"))
  .add(new Field("followerCount", 2, "int64"))
  .add(new Field("followStatus", 3, "int64"))
  .add(new Field("pushStatus", 4, "int64"));

const UserBadge = new Type("UserBadge")
  .add(new MapField("icons", 1, "string", "Image"))
  .add(new Field("title", 2, "string"));

const FansClubData = new Type("FansClubData")
  .add(new Field("clubName", 1, "string"))
  .add(new Field("level", 2, "int32"))
  .add(new Field("userFansClubStatus", 3, "int32"))
  .add(new Field("badge", 4, "UserBadge"))
  .add(new Field("availableGiftIds", 5, "int64", "repeated"))
  .add(new Field("anchorId", 6, "int64"));

const FansClubMember = new Type("FansClubMember")
  .add(new Field("data", 1, "FansClubData"))
  .add(new MapField("preferData", 2, "string", "FansClubData"));

const FansClubInfo = new Type("FansClubInfo")
  .add(new Field("fansLevel", 2, "int64"))
  .add(new Field("fansScore", 3, "int64"))
  .add(new Field("fansCount", 5, "int64"))
  .add(new Field("fansClubName", 6, "string"));

const SubscribeInfo = new Type("SubscribeInfo")
  .add(new Field("isSubscribe", 2, "bool"))
  .add(new Field("subscriberCount", 5, "int64"));

// === User extras (verify, attr, anchor, pay) ===

const UserAttr = new Type("UserAttr")
  .add(new Field("isMuted", 1, "bool"))
  .add(new Field("isAdmin", 2, "bool"))
  .add(new Field("isSuperAdmin", 3, "bool"))
  .add(new Field("muteDuration", 4, "int64"));

const AuthenticationInfo = new Type("AuthenticationInfo")
  .add(new Field("customVerify", 1, "string"))
  .add(new Field("enterpriseVerifyReason", 2, "string"))
  .add(new Field("authenticationBadge", 3, "Image"));

const BorderInfo = new Type("BorderInfo")
  .add(new Field("icon", 1, "Image"))
  .add(new Field("level", 2, "int64"))
  .add(new Field("source", 3, "string"))
  .add(new Field("profileDecorationRibbon", 4, "Image"))
  .add(new Field("avatarBackgroundColor", 7, "string"))
  .add(new Field("avatarBackgroundBorderColor", 8, "string"));

const ComboBadgeInfo = new Type("ComboBadgeInfo")
  .add(new Field("icon", 1, "Image"))
  .add(new Field("comboCount", 2, "int64"));

const AnchorLevel = new Type("AnchorLevel")
  .add(new Field("level", 1, "int64"))
  .add(new Field("experience", 2, "int64"))
  .add(new Field("lowestExperienceThisLevel", 3, "int64"))
  .add(new Field("highestExperienceThisLevel", 4, "int64"))
  .add(new Field("stageLevel", 12, "Image"))
  .add(new Field("smallIcon", 13, "Image"));

const Author = new Type("Author")
  .add(new Field("videoTotalCount", 1, "int64"))
  .add(new Field("videoTotalPlayCount", 2, "int64"))
  .add(new Field("videoTotalFavoriteCount", 6, "int64"));

const UserHonor = new Type("UserHonor")
  .add(new Field("totalDiamond", 1, "int64"))
  .add(new Field("diamondIcon", 2, "Image"))
  .add(new Field("currentHonorName", 3, "string"))
  .add(new Field("currentHonorIcon", 4, "Image"))
  .add(new Field("level", 6, "int32"))
  .add(new Field("currentDiamond", 9, "int64"))
  .add(new Field("score", 25, "int64"));

const GradeIcon = new Type("GradeIcon")
  .add(new Field("icon", 1, "Image"))
  .add(new Field("iconDiamond", 2, "int64"))
  .add(new Field("level", 3, "int64"))
  .add(new Field("levelStr", 4, "string"));

const PayGrade = new Type("PayGrade")
  .add(new Field("totalDiamondCount", 1, "int64"))
  .add(new Field("diamondIcon", 2, "Image"))
  .add(new Field("name", 3, "string"))
  .add(new Field("icon", 4, "Image"))
  .add(new Field("nextName", 5, "string"))
  .add(new Field("level", 6, "int64"))
  .add(new Field("nextIcon", 7, "Image"))
  .add(new Field("nextDiamond", 8, "int64"))
  .add(new Field("nowDiamond", 9, "int64"))
  .add(new Field("thisGradeMinDiamond", 10, "int64"))
  .add(new Field("thisGradeMaxDiamond", 11, "int64"))
  .add(new Field("score", 25, "int64"))
  .add(new Field("gradeIconList", 26, "GradeIcon", "repeated"))
  .add(new Field("gradeBanner", 1001, "string"));

const OwnRoom = new Type("OwnRoom")
  .add(new Field("roomIds", 1, "int64", "repeated"));

const EcommerceEntrance = new Type("EcommerceEntrance")
  .add(new Field("url", 1, "string"))
  .add(new Field("type", 2, "int32"));

// === User (full) ===

const User = new Type("User")
  .add(new Field("id", 1, "int64"))
  .add(new Field("nickname", 3, "string"))
  .add(new Field("bioDescription", 5, "string"))
  .add(new Field("avatarThumb", 9, "Image"))
  .add(new Field("avatarMedium", 10, "Image"))
  .add(new Field("avatarLarge", 11, "Image"))
  .add(new Field("verified", 12, "bool"))
  .add(new Field("status", 15, "int32"))
  .add(new Field("createTime", 16, "int64"))
  .add(new Field("modifyTime", 17, "int64"))
  .add(new Field("secret", 18, "int32"))
  .add(new Field("shareQrcodeUri", 19, "string"))
  .add(new Field("badgeImageList", 21, "Image", "repeated"))
  .add(new Field("followInfo", 22, "FollowInfo"))
  .add(new Field("userHonor", 23, "UserHonor"))
  .add(new Field("fansClub", 24, "FansClubMember"))
  .add(new Field("border", 25, "BorderInfo"))
  .add(new Field("specialId", 26, "string"))
  .add(new Field("avatarBorder", 27, "Image"))
  .add(new Field("medal", 28, "Image"))
  .add(new Field("userBadges", 29, "Image", "repeated"))
  .add(new Field("newUserBadges", 30, "Image", "repeated"))
  .add(new Field("topVipNo", 31, "int32"))
  .add(new Field("userAttr", 32, "UserAttr"))
  .add(new Field("ownRoom", 33, "OwnRoom"))
  .add(new Field("payScore", 34, "int64"))
  .add(new Field("fanTicketCount", 35, "int64"))
  .add(new Field("anchorInfo", 36, "AnchorLevel"))
  .add(new Field("linkMicStats", 37, "int32"))
  .add(new Field("uniqueId", 38, "string"))
  .add(new Field("enableShowCommerceSale", 39, "bool"))
  .add(new Field("withFusionShopEntry", 40, "bool"))
  .add(new Field("payScores", 41, "int64"))
  .add(new Field("anchorLevel", 42, "AnchorLevel"))
  .add(new Field("verifiedContent", 43, "string"))
  .add(new Field("authorInfo", 44, "Author"))
  .add(new Field("topFans", 45, "User", "repeated"))
  .add(new Field("secUid", 46, "string"))
  .add(new Field("userRole", 47, "int32"))
  .add(new Field("personalCard", 52, "Image"))
  .add(new Field("authenticationInfo", 53, "AuthenticationInfo"))
  .add(new Field("mediaBadgeImageList", 57, "Image", "repeated"))
  .add(new Field("commerceWebcastConfigIds", 60, "int64", "repeated"))
  .add(new Field("borders", 61, "BorderInfo", "repeated"))
  .add(new Field("comboBadgeInfo", 62, "ComboBadgeInfo"))
  .add(new Field("subscribeInfo", 63, "SubscribeInfo"))
  .add(new Field("badgeList", 64, "BadgeStruct", "repeated"))
  .add(new Field("mintTypeLabel", 65, "int64", "repeated"))
  .add(new Field("fansClubInfo", 66, "FansClubInfo"))
  .add(new Field("payGrade", 67, "PayGrade"))
  .add(new Field("allowFindByContacts", 1002, "bool"))
  .add(new Field("allowOthersDownloadVideo", 1003, "bool"))
  .add(new Field("allowOthersDownloadWhenSharingVideo", 1004, "bool"))
  .add(new Field("allowShareShowProfile", 1005, "bool"))
  .add(new Field("allowShowInGossip", 1006, "bool"))
  .add(new Field("allowShowMyAction", 1007, "bool"))
  .add(new Field("allowStrangeComment", 1008, "bool"))
  .add(new Field("allowUnfollowerComment", 1009, "bool"))
  .add(new Field("allowUseLinkmic", 1010, "bool"))
  .add(new Field("avatarJpg", 1012, "Image"))
  .add(new Field("backgroundImgUrl", 1013, "string"))
  .add(new Field("blockStatus", 1016, "int32"))
  .add(new Field("commentRestrict", 1017, "int32"))
  .add(new Field("constellation", 1018, "string"))
  .add(new Field("disableIchat", 1019, "int32"))
  .add(new Field("enableIchatImg", 1020, "int64"))
  .add(new Field("exp", 1021, "int32"))
  .add(new Field("foldStrangerChat", 1023, "bool"))
  .add(new Field("followStatus", 1024, "int64"))
  .add(new Field("ichatRestrictType", 1027, "int32"))
  .add(new Field("idStr", 1028, "string"))
  .add(new Field("isFollower", 1029, "bool"))
  .add(new Field("isFollowing", 1030, "bool"))
  .add(new Field("needProfileGuide", 1031, "bool"))
  .add(new Field("pushCommentStatus", 1033, "bool"))
  .add(new Field("pushDigg", 1034, "bool"))
  .add(new Field("pushFollow", 1035, "bool"))
  .add(new Field("pushFriendAction", 1036, "bool"))
  .add(new Field("pushIchat", 1037, "bool"))
  .add(new Field("pushStatus", 1038, "bool"))
  .add(new Field("pushVideoPost", 1039, "bool"))
  .add(new Field("pushVideoRecommend", 1040, "bool"))
  .add(new Field("verifiedReason", 1043, "string"))
  .add(new Field("enableCarManagementPermission", 1044, "bool"))
  .add(new Field("scmLabel", 1046, "string"))
  .add(new Field("ecommerceEntrance", 1047, "EcommerceEntrance"))
  .add(new Field("isBlock", 1048, "bool"))
  .add(new Field("isSubscribe", 1090, "bool"))
  .add(new Field("isAnchorMarked", 1091, "bool"));

// === PublicArea + Emote / MsgFilter ===

const PublicAreaCommon = new Type("PublicAreaCommon")
  .add(new Field("userLabel", 1, "Image"))
  .add(new Field("userConsumeInRoom", 2, "int64"));

const PortraitTagItem = new Type("PortraitTagItem")
  .add(new Field("tagType", 1, "int32"))
  .add(new Field("tagText", 2, "Text"));

const PortraitTopic = new Type("PortraitTopic")
  .add(new Field("topicActionType", 1, "int32"))
  .add(new Field("topicText", 2, "Text"))
  .add(new Field("topicTips", 3, "Text"));

const CreatorSuccessInfo = new Type("CreatorSuccessInfo")
  .add(new Field("tags", 1, "PortraitTagItem", "repeated"))
  .add(new Field("topic", 2, "PortraitTopic"));

const UserMetricsItem = new Type("UserMetricsItem")
  .add(new Field("type", 1, "int32"))
  .add(new Field("metricsValue", 2, "string"));

const PortraitTag = new Type("PortraitTag")
  .add(new Field("tagId", 1, "string"))
  .add(new Field("priority", 2, "int64"))
  .add(new Field("showValue", 3, "string"))
  .add(new Field("showArgs", 4, "string"));

const PortraitInfo = new Type("PortraitInfo")
  .add(new Field("userMetrics", 1, "UserMetricsItem", "repeated"))
  .add(new Field("portraitTag", 2, "PortraitTag", "repeated"));

const UserInteractionInfo = new Type("UserInteractionInfo")
  .add(new Field("likeCnt", 1, "int64"))
  .add(new Field("commentCnt", 2, "int64"))
  .add(new Field("shareCnt", 3, "int64"));

const PublicAreaMessageCommon = new Type("PublicAreaMessageCommon")
  .add(new Field("scrollGapCount", 1, "int64"))
  .add(new Field("anchorScrollGapCount", 2, "int64"))
  .add(new Field("releaseToScrollArea", 3, "bool"))
  .add(new Field("anchorReleaseToScrollArea", 4, "bool"))
  .add(new Field("isAnchorMarked", 5, "bool"))
  .add(new Field("creatorSuccessInfo", 6, "CreatorSuccessInfo"))
  .add(new Field("portraitInfo", 7, "PortraitInfo"))
  .add(new Field("userInteractionInfo", 8, "UserInteractionInfo"))
  .add(new Field("adminFoldType", 9, "int64"));

const MsgFilter = new Type("MsgFilter")
  .add(new Field("isGifter", 1, "bool"))
  .add(new Field("isSubscribedToAnchor", 2, "bool"));

const Emote = new Type("Emote")
  .add(new Field("emoteId", 1, "string"))
  .add(new Field("image", 2, "Image"));

const EmoteData = new Type("EmoteData")
  .add(new Field("placeInComment", 1, "int32"))
  .add(new Field("emote", 2, "Emote"));

// === Gift sub-types ===

const GiftBoxInfo = new Type("GiftBoxInfo")
  .add(new Field("capacity", 1, "int64"))
  .add(new Field("isPrimaryBox", 2, "bool"))
  .add(new Field("schemeUrl", 3, "string"));

const GiftPanelBanner = new Type("GiftPanelBanner")
  .add(new Field("displayText", 1, "Text"))
  .add(new Field("leftIcon", 2, "Image"))
  .add(new Field("schemaUrl", 3, "string"))
  .add(new Field("bgColors", 5, "string", "repeated"))
  .add(new Field("bannerLynxUrl", 6, "string"))
  .add(new Field("bannerPriority", 7, "int32"))
  .add(new Field("bannerLynxExtra", 8, "string"))
  .add(new Field("bgImage", 9, "Image"));

const GiftStruct = new Type("GiftStruct")
  .add(new Field("image", 1, "Image"))
  .add(new Field("describe", 2, "string"))
  .add(new Field("duration", 4, "int32"))
  .add(new Field("id", 5, "int64"))
  .add(new Field("forLinkMic", 7, "bool"))
  .add(new Field("combo", 10, "bool"))
  .add(new Field("type", 11, "int32"))
  .add(new Field("diamondCount", 12, "int32"))
  .add(new Field("isDisplayedOnPanel", 13, "bool"))
  .add(new Field("primaryEffectId", 14, "int64"))
  .add(new Field("giftLabelIcon", 15, "Image"))
  .add(new Field("name", 16, "string"))
  .add(new Field("icon", 21, "Image"))
  .add(new Field("goldEffect", 24, "string"))
  .add(new Field("previewImage", 47, "Image"))
  .add(new Field("giftPanelBanner", 48, "GiftPanelBanner"))
  .add(new Field("isBroadcastGift", 49, "bool"))
  .add(new Field("isEffectBefview", 50, "bool"))
  .add(new Field("isRandomGift", 51, "bool"))
  .add(new Field("isBoxGift", 52, "bool"))
  .add(new Field("canPutInGiftBox", 53, "bool"))
  .add(new Field("giftBoxInfo", 54, "GiftBoxInfo"));

const GiftIMPriority = new Type("GiftIMPriority")
  .add(new Field("queueSizes", 1, "int64", "repeated"))
  .add(new Field("selfQueuePriority", 2, "int64"))
  .add(new Field("priority", 3, "int64"));

const GiftMonitorInfo = new Type("GiftMonitorInfo")
  .add(new Field("anchorId", 1, "int64"))
  .add(new Field("profitApiMessageDur", 2, "int64"))
  .add(new Field("sendGiftProfitApiStartMs", 3, "int64"))
  .add(new Field("sendGiftProfitCoreStartMs", 4, "int64"))
  .add(new Field("sendGiftReqStartMs", 5, "int64"))
  .add(new Field("sendGiftSendMessageSuccessMs", 6, "int64"))
  .add(new Field("sendProfitApiDur", 7, "int64"))
  .add(new Field("toUserId", 8, "int64"))
  .add(new Field("sendGiftStartClientLocalMs", 9, "int64"))
  .add(new Field("fromPlatform", 10, "string"))
  .add(new Field("fromVersion", 11, "string"));

const SponsorshipInfo = new Type("SponsorshipInfo")
  .add(new Field("giftId", 1, "int64"))
  .add(new Field("sponsorId", 2, "int64"))
  .add(new Field("lightGiftUp", 3, "bool"))
  .add(new Field("unlightedGiftIcon", 4, "string"))
  .add(new Field("giftGalleryDetailPageSchemeUrl", 5, "string"))
  .add(new Field("giftGalleryClickSponsor", 6, "bool"))
  .add(new Field("becomeAllSponsored", 21, "bool"));

const MatchInfo = new Type("MatchInfo")
  .add(new Field("critical", 1, "int64"))
  .add(new Field("effectCardInUse", 2, "bool"))
  .add(new Field("multiplierType", 3, "int32"))
  .add(new Field("multiplierValue", 4, "int64"));

const GiftTrayInfo = new Type("GiftTrayInfo")
  .add(new Field("mDynamicImg", 1, "Image"))
  .add(new Field("canMirror", 2, "bool"))
  .add(new Field("trayNormalBgImg", 3, "Image"))
  .add(new Field("trayNormalBgColor", 4, "string", "repeated"))
  .add(new Field("traySmallBgImg", 5, "Image"))
  .add(new Field("traySmallBgColor", 6, "string", "repeated"))
  .add(new Field("rightTagText", 7, "Text"))
  .add(new Field("rightTagBgImg", 8, "Image"))
  .add(new Field("rightTagBgColor", 9, "string", "repeated"))
  .add(new Field("trayNameTextColor", 10, "string"))
  .add(new Field("trayDescTextColor", 11, "string"))
  .add(new Field("rightTagJumpSchema", 12, "string"));

const InteractiveGiftInfo = new Type("InteractiveGiftInfo")
  .add(new Field("crossScreenDelay", 1, "int64"))
  .add(new Field("crossScreenRole", 2, "int64"))
  .add(new Field("uniqId", 4, "int64"))
  .add(new Field("toUserTeamId", 5, "int64"));

const LynxGiftExtra = new Type("LynxGiftExtra")
  .add(new Field("id", 1, "int64"))
  .add(new Field("code", 2, "int64"))
  .add(new Field("type", 3, "int64"))
  .add(new Field("params", 4, "string", "repeated"))
  .add(new Field("extra", 5, "string"));

const TextEffectDetail = new Type("TextEffectDetail")
  .add(new Field("text", 1, "Text"))
  .add(new Field("textFontSize", 2, "int32"))
  .add(new Field("background", 3, "Image"))
  .add(new Field("start", 4, "int64"))
  .add(new Field("duration", 5, "int64"))
  .add(new Field("x", 6, "int32"))
  .add(new Field("y", 7, "int32"));

const TextEffect = new Type("TextEffect")
  .add(new Field("portraitDetail", 1, "TextEffectDetail"))
  .add(new Field("landscapeDetail", 2, "TextEffectDetail"));

[
  ImageContent, Image, TextFormat, PatternRef, TextPieceUser, TextPieceGift, TextPiece, Text,
  Common, UserIdentity,
  PrivilegeLogExtra, ImageBadge, TextBadge, StringBadge, CombineBadgeBackground, FontStyle,
  BadgeText, CombineBadge, BadgeStruct,
  FollowInfo, UserBadge, FansClubData, FansClubMember, FansClubInfo, SubscribeInfo,
  UserAttr, AuthenticationInfo, BorderInfo, ComboBadgeInfo, AnchorLevel, Author, UserHonor,
  GradeIcon, PayGrade, OwnRoom, EcommerceEntrance, User,
  PublicAreaCommon, PortraitTagItem, PortraitTopic, CreatorSuccessInfo, UserMetricsItem,
  PortraitTag, PortraitInfo, UserInteractionInfo, PublicAreaMessageCommon,
  MsgFilter, Emote, EmoteData,
  GiftBoxInfo, GiftPanelBanner, GiftStruct, GiftIMPriority, GiftMonitorInfo,
  SponsorshipInfo, MatchInfo, GiftTrayInfo, InteractiveGiftInfo, LynxGiftExtra,
  TextEffectDetail, TextEffect,
].forEach((t) => root.add(t));

// === Core Webcast events ===

root.add(new Type("WebcastChatMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("user", 2, "User"))
  .add(new Field("content", 3, "string"))
  .add(new Field("visibleToSender", 4, "bool"))
  .add(new Field("background", 5, "Image"))
  .add(new Field("fullScreenTextColor", 6, "string"))
  .add(new Field("backgroundImageV2", 7, "Image"))
  .add(new Field("publicAreaCommon", 9, "PublicAreaCommon"))
  .add(new Field("giftImage", 10, "Image"))
  .add(new Field("inputType", 11, "int32"))
  .add(new Field("atUser", 12, "User"))
  .add(new Field("emotes", 13, "EmoteData", "repeated"))
  .add(new Field("contentLanguage", 14, "string"))
  .add(new Field("msgFilter", 15, "MsgFilter"))
  .add(new Field("quickChatScene", 16, "int32"))
  .add(new Field("communityflaggedStatus", 17, "int32"))
  .add(new Field("userIdentity", 18, "UserIdentity"))
  .add(new Field("commentTag", 20, "int32", "repeated"))
  .add(new Field("publicAreaMessageCommon", 21, "PublicAreaMessageCommon"))
  .add(new Field("screenTime", 22, "int64"))
  .add(new Field("signature", 23, "string"))
  .add(new Field("signatureVersion", 24, "string"))
  .add(new Field("ecStreamerKey", 25, "string"))
);

root.add(new Type("WebcastGiftMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("giftId", 2, "int32"))
  .add(new Field("fanTicketCount", 3, "int64"))
  .add(new Field("groupCount", 4, "int32"))
  .add(new Field("repeatCount", 5, "int32"))
  .add(new Field("comboCount", 6, "int32"))
  .add(new Field("user", 7, "User"))
  .add(new Field("toUser", 8, "User"))
  .add(new Field("repeatEnd", 9, "int32"))
  .add(new Field("textEffect", 10, "TextEffect"))
  .add(new Field("groupId", 11, "uint64"))
  .add(new Field("incomeTaskgifts", 12, "int64"))
  .add(new Field("roomFanTicketCount", 13, "int64"))
  .add(new Field("priority", 14, "GiftIMPriority"))
  .add(new Field("gift", 15, "GiftStruct"))
  .add(new Field("logId", 16, "string"))
  .add(new Field("sendType", 17, "int64"))
  .add(new Field("publicAreaCommon", 18, "PublicAreaCommon"))
  .add(new Field("trayDisplayText", 19, "Text"))
  .add(new Field("bannedDisplayEffects", 20, "int64"))
  .add(new Field("trayInfo", 21, "GiftTrayInfo"))
  .add(new Field("monitorExtra", 22, "string"))
  .add(new Field("giftExtra", 23, "GiftMonitorInfo"))
  .add(new Field("colorId", 24, "int64"))
  .add(new Field("isFirstSent", 25, "bool"))
  .add(new Field("displayTextForAnchor", 26, "Text"))
  .add(new Field("displayTextForAudience", 27, "Text"))
  .add(new Field("orderId", 28, "string"))
  .add(new Field("giftsInBoxBlob", 29, "bytes"))
  .add(new Field("msgFilter", 30, "MsgFilter"))
  .add(new Field("lynxExtra", 31, "LynxGiftExtra", "repeated"))
  .add(new Field("userIdentity", 32, "UserIdentity"))
  .add(new Field("matchInfo", 33, "MatchInfo"))
  .add(new Field("linkmicGiftExpressionStrategy", 34, "int32"))
  .add(new Field("flyingMicResourcesBlob", 35, "bytes"))
  .add(new Field("disableGiftTracking", 36, "bool"))
  .add(new Field("assetBlob", 37, "bytes"))
  .add(new Field("version", 38, "int32"))
  .add(new Field("sponsorshipInfo", 39, "SponsorshipInfo", "repeated"))
  .add(new Field("flyingMicResourcesV2Blob", 40, "bytes"))
  .add(new Field("publicAreaMessageCommon", 41, "PublicAreaMessageCommon"))
  .add(new Field("signature", 42, "string"))
  .add(new Field("signatureVersion", 43, "string"))
  .add(new Field("multiGenerateMessage", 44, "bool"))
  .add(new Field("toMemberId", 45, "string"))
  .add(new Field("toMemberIdInt", 46, "int64"))
  .add(new Field("toMemberNickname", 47, "string"))
  .add(new Field("interactiveGiftInfo", 48, "InteractiveGiftInfo"))
);

root.add(new Type("WebcastLikeMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("count", 2, "int32"))
  .add(new Field("total", 3, "int64"))
  .add(new Field("color", 4, "int32"))
  .add(new Field("user", 5, "User"))
  .add(new Field("icon", 6, "string"))
  .add(new Field("icons", 7, "Image", "repeated"))
  .add(new Field("effectCnt", 9, "int64"))
  .add(new Field("publicAreaMessageCommon", 11, "PublicAreaMessageCommon"))
  .add(new Field("roomMessageHeatLevel", 12, "int64"))
);

root.add(new Type("WebcastMemberMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("user", 2, "User"))
  .add(new Field("memberCount", 3, "int32"))
  .add(new Field("operator", 4, "User"))
  .add(new Field("isSetToAdmin", 5, "bool"))
  .add(new Field("isTopUser", 6, "bool"))
  .add(new Field("rankScore", 7, "int32"))
  .add(new Field("topUserNo", 8, "int32"))
  .add(new Field("enterType", 9, "int32"))
  .add(new Field("action", 10, "int32"))
  .add(new Field("actionDescription", 11, "string"))
  .add(new Field("userId", 12, "int64"))
  .add(new Field("popStr", 14, "string"))
  .add(new Field("background", 17, "Image"))
  .add(new Field("anchorDisplayText", 18, "Text"))
  .add(new Field("clientEnterSource", 19, "string"))
  .add(new Field("clientEnterType", 20, "string"))
  .add(new Field("clientLiveReason", 21, "string"))
  .add(new Field("actionDuration", 22, "int64"))
  .add(new Field("userShareType", 23, "string"))
  .add(new Field("displayStyle", 24, "int32"))
  .add(new Field("kickSource", 26, "int32"))
  .add(new Field("allowPreviewTime", 27, "int64"))
  .add(new Field("lastSubscriptionAction", 28, "int64"))
  .add(new Field("publicAreaMessageCommon", 29, "PublicAreaMessageCommon"))
  .add(new Field("liveSubOnlyTier", 30, "int64"))
  .add(new Field("liveSubOnlyMonth", 31, "int64"))
  .add(new Field("ecStreamerKey", 32, "string"))
  .add(new Field("showWave", 33, "int64"))
  .add(new Field("hitAbStatus", 35, "int32"))
);

root.add(new Type("Contributor")
  .add(new Field("score", 1, "int64"))
  .add(new Field("user", 2, "User"))
  .add(new Field("rank", 3, "int64"))
  .add(new Field("delta", 4, "int64"))
);

root.add(new Type("WebcastRoomUserSeqMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("ranksList", 2, "Contributor", "repeated"))
  .add(new Field("viewerCount", 3, "int64"))
  .add(new Field("popStr", 4, "string"))
  .add(new Field("seatsList", 5, "Contributor", "repeated"))
  .add(new Field("popularity", 6, "int64"))
  .add(new Field("totalUser", 7, "int64"))
  .add(new Field("anonymous", 8, "int64"))
);

root.add(new Type("WebcastSocialMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("user", 2, "User"))
  .add(new Field("shareType", 3, "int64"))
  .add(new Field("action", 4, "int64"))
  .add(new Field("shareTarget", 5, "string"))
  .add(new Field("followCount", 6, "int64"))
  .add(new Field("shareDisplayStyle", 7, "int64"))
  .add(new Field("shareCount", 8, "int32"))
  .add(new Field("publicAreaMessageCommon", 9, "PublicAreaMessageCommon"))
  .add(new Field("signature", 10, "string"))
  .add(new Field("signatureVersion", 11, "string"))
  .add(new Field("showDurationMs", 12, "int64"))
);

root.add(new Type("WebcastControlExtra")
  .add(new Field("reasonNo", 2, "int64"))
  .add(new Field("source", 8, "string"))
);

root.add(new Type("WebcastControlMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("action", 2, "int32"))
  .add(new Field("tips", 3, "string"))
  .add(new Field("extra", 4, "WebcastControlExtra"))
  .add(new Field("floatStyle", 9, "int32"))
);

root.add(new Type("WebcastLiveIntroMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("id", 2, "int64"))
  .add(new Field("auditStatus", 3, "int32"))
  .add(new Field("content", 4, "string"))
  .add(new Field("user", 5, "User"))
  .add(new Field("introMode", 6, "int32"))
  .add(new Field("badges", 7, "BadgeStruct", "repeated"))
  .add(new Field("contentLanguage", 8, "string"))
);

root.add(new Type("WebcastRoomMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("content", 2, "string"))
  .add(new Field("supprotLandscape", 3, "bool"))
  .add(new Field("source", 4, "int32"))
  .add(new Field("icon", 5, "Image"))
  .add(new Field("scene", 6, "int32"))
  .add(new Field("isWelcome", 7, "bool"))
  .add(new Field("publicAreaCommon", 8, "PublicAreaMessageCommon"))
  .add(new Field("showDurationMs", 9, "int64"))
  .add(new Field("subScene", 10, "string"))
);

root.add(new Type("CaptionContent")
  .add(new Field("language", 1, "string"))
  .add(new Field("text", 2, "string"))
);

root.add(new Type("WebcastCaptionMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("timestampMs", 2, "int64"))
  .add(new Field("durationMs", 3, "int64"))
  .add(new Field("content", 4, "CaptionContent", "repeated"))
  .add(new Field("sentenceId", 5, "int64"))
  .add(new Field("sequenceId", 6, "int64"))
  .add(new Field("definite", 7, "bool"))
);

root.add(new Type("WebcastGoalUpdateMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("indicatorBlob", 2, "bytes"))
  .add(new Field("goalBlob", 3, "bytes"))
  .add(new Field("contributorId", 4, "int64"))
  .add(new Field("contributorAvatar", 5, "Image"))
  .add(new Field("contributorDisplayId", 6, "string"))
  .add(new Field("contributeSubgoalBlob", 7, "bytes"))
  .add(new Field("contributeCount", 9, "int64"))
  .add(new Field("contributeScore", 10, "int64"))
  .add(new Field("giftRepeatCount", 11, "int64"))
  .add(new Field("contributorIdStr", 12, "string"))
  .add(new Field("pin", 13, "bool"))
  .add(new Field("unpin", 14, "bool"))
  .add(new Field("pinInfoBlob", 15, "bytes"))
  .add(new Field("updateSource", 16, "int32"))
  .add(new Field("goalExtra", 17, "string"))
);

root.add(new Type("WebcastImDeleteMessage")
  .add(new Field("common", 1, "Common"))
  .add(new Field("deleteMsgIdsList", 2, "int64", "repeated"))
  .add(new Field("deleteUserIdsList", 3, "int64", "repeated"))
);

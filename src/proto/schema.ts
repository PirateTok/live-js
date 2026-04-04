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

// === Common types ===

const Image = new Type("Image")
  .add(new Field("urlList", 1, "string", "repeated"))
  .add(new Field("uri", 2, "string"))
  .add(new Field("width", 3, "int32"))
  .add(new Field("height", 4, "int32"));

const Text = new Type("Text")
  .add(new Field("key", 1, "string"))
  .add(new Field("defaultPattern", 2, "string"));

const Common = new Type("Common")
  .add(new Field("method", 1, "string"))
  .add(new Field("msgId", 2, "int64"))
  .add(new Field("roomId", 3, "int64"))
  .add(new Field("createTime", 4, "int64"))
  .add(new Field("describe", 7, "string"));

const PrivilegeLogExtra = new Type("PrivilegeLogExtra")
  .add(new Field("dataVersion", 1, "string"))
  .add(new Field("privilegeId", 2, "string"))
  .add(new Field("level", 5, "string"));

const BadgeImage = new Type("BadgeImage")
  .add(new Field("image", 2, "Image"));

const BadgeText = new Type("BadgeText")
  .add(new Field("key", 2, "string"))
  .add(new Field("defaultPattern", 3, "string"));

const BadgeString = new Type("BadgeString")
  .add(new Field("contentStr", 2, "string"));

// badge_scene: ADMIN=1, SUBSCRIBER=4, RANK_LIST=6, USER_GRADE=8, FANS=10
const BadgeStruct = new Type("BadgeStruct")
  .add(new Field("displayType", 1, "int32"))
  .add(new Field("badgeScene", 3, "int32"))
  .add(new Field("display", 11, "bool"))
  .add(new Field("logExtra", 12, "PrivilegeLogExtra"))
  .add(new Field("imageBadge", 20, "BadgeImage"))
  .add(new Field("textBadge", 21, "BadgeText"))
  .add(new Field("stringBadge", 22, "BadgeString"));

const FollowInfo = new Type("FollowInfo")
  .add(new Field("followingCount", 1, "int64"))
  .add(new Field("followerCount", 2, "int64"))
  .add(new Field("followStatus", 3, "int64"));

const FansClubData = new Type("FansClubData")
  .add(new Field("clubName", 1, "string"))
  .add(new Field("level", 2, "int32"));

const FansClubMember = new Type("FansClubMember")
  .add(new Field("data", 1, "FansClubData"));

const User = new Type("User")
  .add(new Field("id", 1, "int64"))
  .add(new Field("nickname", 3, "string"))
  .add(new Field("bioDescription", 5, "string"))
  .add(new Field("avatarThumb", 9, "Image"))
  .add(new Field("avatarMedium", 10, "Image"))
  .add(new Field("avatarLarge", 11, "Image"))
  .add(new Field("verified", 12, "bool"))
  .add(new Field("followInfo", 22, "FollowInfo"))
  .add(new Field("fansClub", 24, "FansClubMember"))
  .add(new Field("topVipNo", 31, "int32"))
  .add(new Field("payScore", 34, "int64"))
  .add(new Field("fanTicketCount", 35, "int64"))
  .add(new Field("uniqueId", 38, "string"))
  .add(new Field("displayId", 46, "string"))
  .add(new Field("badgeList", 64, "BadgeStruct", "repeated"))
  .add(new Field("followStatus", 1024, "int64"))
  .add(new Field("isFollower", 1029, "bool"))
  .add(new Field("isFollowing", 1030, "bool"))
  .add(new Field("isSubscribe", 1090, "bool"));

const GiftStruct = new Type("GiftStruct")
  .add(new Field("image", 1, "Image"))
  .add(new Field("describe", 2, "string"))
  .add(new Field("duration", 4, "int64"))
  .add(new Field("id", 5, "int64"))
  .add(new Field("combo", 10, "bool"))
  .add(new Field("type", 11, "int32"))
  .add(new Field("diamondCount", 12, "int32"))
  .add(new Field("name", 16, "string"));

const Emote = new Type("Emote")
  .add(new Field("emoteId", 1, "string"))
  .add(new Field("image", 2, "Image"));

const UserIdentity = new Type("UserIdentity")
  .add(new Field("isGiftGiverOfAnchor", 1, "bool"))
  .add(new Field("isSubscriberOfAnchor", 2, "bool"))
  .add(new Field("isMutualFollowingWithAnchor", 3, "bool"))
  .add(new Field("isFollowerOfAnchor", 4, "bool"))
  .add(new Field("isModeratorOfAnchor", 5, "bool"))
  .add(new Field("isAnchor", 6, "bool"));

root.add(Image);
root.add(Text);
root.add(Common);
root.add(PrivilegeLogExtra);
root.add(BadgeImage);
root.add(BadgeText);
root.add(BadgeString);
root.add(BadgeStruct);
root.add(FollowInfo);
root.add(FansClubData);
root.add(FansClubMember);
root.add(User);
root.add(GiftStruct);
root.add(Emote);
root.add(UserIdentity);

// === Core message types ===

root.add(
  new Type("WebcastChatMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("user", 2, "User"))
    .add(new Field("content", 3, "string"))
    .add(new Field("contentLanguage", 14, "string"))
);

root.add(
  new Type("WebcastGiftMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("giftId", 2, "int64"))
    .add(new Field("fanTicketCount", 3, "int64"))
    .add(new Field("groupCount", 4, "int32"))
    .add(new Field("repeatCount", 5, "int32"))
    .add(new Field("comboCount", 6, "int32"))
    .add(new Field("user", 7, "User"))
    .add(new Field("toUser", 8, "User"))
    .add(new Field("repeatEnd", 9, "int32"))
    .add(new Field("groupId", 11, "int64"))
    .add(new Field("roomFanTicketCount", 13, "int64"))
    .add(new Field("gift", 15, "GiftStruct"))
    .add(new Field("sendType", 17, "int64"))
);

root.add(
  new Type("WebcastLikeMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("count", 2, "int32"))
    .add(new Field("total", 3, "int32"))
    .add(new Field("user", 5, "User"))
);

root.add(
  new Type("WebcastMemberMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("user", 2, "User"))
    .add(new Field("memberCount", 3, "int32"))
    .add(new Field("action", 10, "int32"))
    .add(new Field("actionDescription", 11, "string"))
);

root.add(
  new Type("WebcastSocialMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("user", 2, "User"))
    .add(new Field("shareType", 3, "int64"))
    .add(new Field("action", 4, "int64"))
    .add(new Field("shareTarget", 5, "string"))
    .add(new Field("followCount", 6, "int32"))
    .add(new Field("shareCount", 8, "int32"))
);

root.add(
  new Type("WebcastRoomUserSeqMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("total", 3, "int64"))
    .add(new Field("popStr", 4, "string"))
    .add(new Field("popularity", 6, "int64"))
    .add(new Field("totalUser", 7, "int32"))
);

root.add(
  new Type("WebcastControlMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("action", 2, "int32"))
    .add(new Field("tips", 3, "string"))
);

root.add(
  new Type("WebcastLiveIntroMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("roomId", 2, "int64"))
    .add(new Field("content", 4, "string"))
    .add(new Field("host", 5, "User"))
    .add(new Field("language", 8, "string"))
);

root.add(
  new Type("WebcastRoomMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("content", 2, "string"))
);

root.add(
  new Type("WebcastCaptionMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("timeStamp", 2, "uint64"))
);

root.add(
  new Type("WebcastGoalUpdateMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("contributorId", 4, "int64"))
    .add(new Field("contributeCount", 9, "int64"))
    .add(new Field("contributeScore", 10, "int64"))
    .add(new Field("pin", 13, "bool"))
    .add(new Field("unpin", 14, "bool"))
);

root.add(
  new Type("WebcastImDeleteMessage")
    .add(new Field("common", 1, "Common"))
    .add(new Field("deleteMsgIdsList", 2, "int64", "repeated"))
    .add(new Field("deleteUserIdsList", 3, "int64", "repeated"))
);

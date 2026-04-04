export const EventType = {
  // Control
  connected: "connected",
  reconnecting: "reconnecting",
  disconnected: "disconnected",
  unknown: "unknown",

  // core
  chat: "chat",
  gift: "gift",
  like: "like",
  member: "member",
  social: "social",
  roomUserSeq: "roomUserSeq",
  control: "control",

  // Sub-routed convenience
  follow: "follow",
  share: "share",
  join: "join",
  liveEnded: "liveEnded",

  // useful
  liveIntro: "liveIntro",
  roomMessage: "roomMessage",
  caption: "caption",
  goalUpdate: "goalUpdate",
  imDelete: "imDelete",

  // niche + extended
  rankUpdate: "rankUpdate",
  poll: "poll",
  envelope: "envelope",
  roomPin: "roomPin",
  unauthorizedMember: "unauthorizedMember",
  linkMicMethod: "linkMicMethod",
  linkMicBattle: "linkMicBattle",
  linkMicArmies: "linkMicArmies",
  linkMessage: "linkMessage",
  linkLayer: "linkLayer",
  linkMicLayoutState: "linkMicLayoutState",
  giftPanelUpdate: "giftPanelUpdate",
  inRoomBanner: "inRoomBanner",
  guide: "guide",
  emoteChat: "emoteChat",
  questionNew: "questionNew",
  subNotify: "subNotify",
  barrage: "barrage",
  hourlyRank: "hourlyRank",
  msgDetect: "msgDetect",
  linkMicFanTicket: "linkMicFanTicket",
  roomVerify: "roomVerify",
  oecLiveShopping: "oecLiveShopping",
  giftBroadcast: "giftBroadcast",
  rankText: "rankText",
  giftDynamicRestriction: "giftDynamicRestriction",
  viewerPicksUpdate: "viewerPicksUpdate",

  // secondary
  accessControl: "accessControl",
  accessRecall: "accessRecall",
  alertBoxAuditResult: "alertBoxAuditResult",
  bindingGift: "bindingGift",
  boostCard: "boostCard",
  bottom: "bottom",
  gameRankNotify: "gameRankNotify",
  giftPrompt: "giftPrompt",
  linkState: "linkState",
  linkMicBattlePunishFinish: "linkMicBattlePunishFinish",
  linkmicBattleTask: "linkmicBattleTask",
  marqueeAnnouncement: "marqueeAnnouncement",
  notice: "notice",
  notify: "notify",
  partnershipDropsUpdate: "partnershipDropsUpdate",
  partnershipGameOffline: "partnershipGameOffline",
  partnershipPunish: "partnershipPunish",
  perception: "perception",
  speaker: "speaker",
  subCapsule: "subCapsule",
  subPinEvent: "subPinEvent",
  subscriptionNotify: "subscriptionNotify",
  toast: "toast",
  system: "system",
  liveGameIntro: "liveGameIntro",
} as const;

export type EventTypeName = (typeof EventType)[keyof typeof EventType];

export interface TikTokEvent {
  type: EventTypeName;
  data: unknown;
  roomId?: string;
}

export interface UnknownEvent {
  method: string;
  payload: Uint8Array;
}

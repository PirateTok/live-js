import { TikTokLiveClient, EventType, GiftStreakTracker } from "../dist/index.js";

const username = process.argv[2];
if (!username) {
  console.log("Usage: node gift-streak.js <username>");
  process.exit(1);
}

const client = new TikTokLiveClient(username);
const tracker = new GiftStreakTracker();
let totalDiamonds = 0;

client.on(EventType.connected, (data) => {
  console.log(`Connected to @${username} (room ${data.roomId})\n`);
});

client.on(EventType.gift, (data) => {
  const enriched = tracker.process(data);

  const nick = data.user?.uniqueId ?? data.user?.nickname ?? "?";
  const giftName = data.gift?.describe ?? data.gift?.name ?? `gift#${data.giftId}`;

  if (enriched.isFinal) {
    totalDiamonds += enriched.totalDiamondCount;
    console.log(`[FINAL] streak=${enriched.streakId} ${nick} -> ${giftName} x${enriched.totalGiftCount} — ${enriched.totalDiamondCount} diamonds`);
    console.log(`        running total: ${totalDiamonds} diamonds\n`);
  } else if (enriched.eventGiftCount > 0) {
    console.log(`[ongoing] streak=${enriched.streakId} ${nick} -> ${giftName} +${enriched.eventGiftCount} (+${enriched.eventDiamondCount} dmnd)`);
  }
});

client.on(EventType.disconnected, () => {
  console.log(`\nFinal total: ${totalDiamonds} diamonds`);
  console.log(`Active streaks at disconnect: ${tracker.activeStreaks()}`);
});

client.on("error", (err) => {
  console.error(`[error] ${err}`);
});

process.on("SIGINT", () => {
  client.disconnect();
});

console.log(`Connecting to @${username}...`);
await client.connect().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});

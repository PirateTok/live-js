import { TikTokLiveClient, EventType } from "../dist/index.js";

const username = process.argv[2];
if (!username) {
  console.log("Usage: node gift-tracker.js <username>");
  process.exit(1);
}

const totals = new Map();
let totalDiamonds = 0;

const client = new TikTokLiveClient(username);

client.on(EventType.connected, (data) => {
  console.log(`Connected to room ${data.roomId}! Tracking gifts...\n`);
});

client.on(EventType.gift, (data) => {
  const nick = data.user?.nickname ?? "?";
  const giftName = data.gift?.describe ?? data.gift?.name ?? `gift#${data.giftId}`;
  const diamonds = Number(data.gift?.diamondCount ?? 0);
  const repeatEnd = data.repeatEnd === 1;
  const repeatCount = Number(data.repeatCount ?? 1);

  const key = `${nick}:${data.giftId}`;
  totals.set(key, { name: giftName, diamonds, count: repeatCount });

  if (repeatEnd) {
    totalDiamonds += diamonds * repeatCount;
    console.log(`[gift] ${nick} sent ${repeatCount}x ${giftName} (${diamonds} diamonds each)`);
  }
});

client.on(EventType.liveEnded, () => {
  console.log("\n[stream ended]");
  printSummary();
  process.exit(0);
});

client.on(EventType.disconnected, () => {
  console.log("\n[disconnected]");
  printSummary();
  process.exit(0);
});

client.on("error", (err) => {
  console.error(`[error] ${err}`);
});

function printSummary() {
  if (totals.size === 0) return;
  const rows = [...totals.entries()]
    .map(([key, e]) => ({ key, ...e, total: e.diamonds * e.count }))
    .sort((a, b) => b.total - a.total);

  console.log("\n=== Gift Summary ===");
  for (const r of rows) {
    console.log(`  ${r.key}: ${r.count}x ${r.name} = ${r.total} diamonds`);
  }
  console.log(`\nTotal diamonds: ${totalDiamonds}`);
}

process.on("SIGINT", () => {
  client.disconnect();
  printSummary();
  process.exit(0);
});

console.log(`Connecting to @${username}...`);
await client.connect().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});

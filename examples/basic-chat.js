import { TikTokLiveClient, EventType } from "../dist/index.js";

const username = process.argv[2];
if (!username) {
  console.log("Usage: node basic-chat.js <username>");
  process.exit(1);
}

const client = new TikTokLiveClient(username);

client.on(EventType.connected, (data) => {
  console.log(`Connected to room ${data.roomId}! Waiting for events...\n`);
});

client.on(EventType.chat, (data) => {
  const nick = data.user?.nickname ?? "?";
  console.log(`${nick}: ${data.content}`);
});

client.on(EventType.follow, (data) => {
  const nick = data.user?.nickname ?? "?";
  console.log(`[follow] ${nick}`);
});

client.on(EventType.share, (data) => {
  const nick = data.user?.nickname ?? "?";
  console.log(`[share] ${nick}`);
});

client.on(EventType.join, (data) => {
  console.log(`[join] member_count=${data.memberCount ?? 0}`);
});

client.on(EventType.like, (data) => {
  const nick = data.user?.nickname ?? "?";
  console.log(`[like] ${nick} (${data.total} total)`);
});

client.on(EventType.roomUserSeq, (data) => {
  console.log(`[viewers] ${data.totalUser} total, pop=${data.popularity}`);
});

client.on(EventType.liveEnded, () => {
  console.log("[control] stream ended");
  process.exit(0);
});

client.on(EventType.disconnected, () => {
  console.log("[disconnected]");
  process.exit(0);
});

client.on("error", (err) => {
  console.error(`[error] ${err}`);
});

process.on("SIGINT", () => {
  client.disconnect();
});

console.log(`Connecting to @${username}...`);
await client.connect().catch((err) => {
  console.error(`Failed to connect: ${err.message}`);
  process.exit(1);
});

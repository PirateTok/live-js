import { checkOnline, fetchRoomAudience, SessionRequiredError } from "../dist/index.js";

const username = process.argv[2];
const cookies = process.argv[3] ?? "";

if (!username) {
  console.log('Usage: node audience.js <username> "sessionid=xxx; sid_tt=xxx"');
  process.exit(1);
}

try {
  const room = await checkOnline(username);
  const audience = await fetchRoomAudience(room.roomId, room.anchorId, cookies);

  console.log(`Room ${room.roomId}: ${audience.total} viewers (${audience.anonymous} anonymous)\n`);
  for (const v of audience.viewers) {
    const flags = [v.verified && "verified", v.isFollower && "follower", v.isSubscriber && "sub"]
      .filter(Boolean).join(",");
    console.log(`#${v.rank} @${v.username} (${v.nickname}) score=${v.score} ${flags}`);
  }
} catch (err) {
  if (err instanceof SessionRequiredError) {
    console.log("The audience roster needs login — pass your TikTok session cookies as the second argument");
    process.exit(1);
  }
  console.error(`Failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

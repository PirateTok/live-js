import { checkOnline, fetchRoomInfo, AgeRestrictedError } from "../dist/index.js";

const username = process.argv[2];
const cookies = process.argv[3] ?? "";

if (!username) {
  console.log("Usage: node stream-info.js <username> [cookies]");
  process.exit(1);
}

try {
  const room = await checkOnline(username);
  const info = await fetchRoomInfo(room.roomId, 10_000, cookies);

  console.log("=== Room Info ===");
  console.log(`Username: @${username}`);
  console.log(`Room ID:  ${room.roomId}`);
  console.log(`Title:    ${info.title}`);
  console.log(`Viewers:  ${info.viewers}`);
  console.log(`Likes:    ${info.likes}`);
  console.log(`Total:    ${info.totalUser} unique viewers`);

  if (info.streamUrl) {
    console.log("\n=== Stream URLs (FLV) ===");
    if (info.streamUrl.flvOrigin) console.log(`Origin: ${info.streamUrl.flvOrigin}`);
    if (info.streamUrl.flvHd) console.log(`HD:     ${info.streamUrl.flvHd}`);
    if (info.streamUrl.flvSd) console.log(`SD:     ${info.streamUrl.flvSd}`);
    if (info.streamUrl.flvLd) console.log(`LD:     ${info.streamUrl.flvLd}`);
    if (info.streamUrl.flvAudio) console.log(`Audio:  ${info.streamUrl.flvAudio}`);
  }
} catch (err) {
  if (err instanceof AgeRestrictedError) {
    console.log("Room info failed: age-restricted stream: 18+ room — pass session cookies");
    console.log("Hint: pass session cookies as the second argument");
    process.exit(1);
  }
  console.error(`Failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}

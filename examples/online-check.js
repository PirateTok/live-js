import { checkOnline, UserNotFoundError, HostNotOnlineError, TikTokBlockedError } from "../dist/index.js";

const username = process.argv[2];
if (!username) {
  console.log("Usage: node online-check.js <username>");
  process.exit(1);
}

try {
  const result = await checkOnline(username);
  console.log(`  LIVE  @${username} — room ${result.roomId}`);
} catch (err) {
  if (err instanceof HostNotOnlineError) {
    console.log(`  OFF   @${username} — not currently live`);
  } else if (err instanceof UserNotFoundError) {
    console.log(`  404   @${username} — user does not exist`);
  } else if (err instanceof TikTokBlockedError) {
    console.error(`  BLOCKED  @${username} — ${err.message}`);
    process.exit(1);
  } else {
    console.error(`  ERROR  @${username} — ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}

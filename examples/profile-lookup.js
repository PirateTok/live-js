import { ProfileCache, ProfilePrivateError, ProfileNotFoundError } from "../dist/index.js";

const username = process.argv[2] || "tiktok";
const cache = new ProfileCache();

console.log(`Fetching profile for @${username}...`);
try {
  const p = await cache.fetch(username);
  console.log(`  User ID:    ${p.userId}`);
  console.log(`  Nickname:   ${p.nickname}`);
  console.log(`  Verified:   ${p.verified}`);
  console.log(`  Followers:  ${p.followerCount}`);
  console.log(`  Videos:     ${p.videoCount}`);
  console.log(`  Avatar (thumb):  ${p.avatarThumb}`);
  console.log(`  Avatar (720):    ${p.avatarMedium}`);
  console.log(`  Avatar (1080):   ${p.avatarLarge}`);
  console.log(`  Bio link:   ${p.bioLink ?? "(none)"}`);
  console.log(`  Room ID:    ${p.roomId || "(offline)"}`);

  console.log(`\nFetching @${username} again (should be cached)...`);
  const p2 = await cache.fetch(username);
  console.log(`  [cached] ${p2.nickname} — ${p2.followerCount} followers`);
} catch (err) {
  if (err instanceof ProfilePrivateError) {
    console.log(`  @${username} is a private account`);
  } else if (err instanceof ProfileNotFoundError) {
    console.log(`  @${username} does not exist`);
  } else {
    throw err;
  }
}

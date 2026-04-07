import {
  ProfileError,
  ProfileNotFoundError,
  ProfilePrivateError,
  ProfileScrapeError,
} from "./api.js";
import { randomUa } from "./ua.js";

const SIGI_MARKER = 'id="__UNIVERSAL_DATA_FOR_REHYDRATION__"';

export interface SigiProfile {
  userId: string;
  uniqueId: string;
  nickname: string;
  bio: string;
  avatarThumb: string;
  avatarMedium: string;
  avatarLarge: string;
  verified: boolean;
  privateAccount: boolean;
  isOrganization: boolean;
  roomId: string;
  bioLink: string | null;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  friendCount: number;
}

export async function scrapeProfile(
  username: string,
  ttwid: string,
  timeoutMs = 15_000,
  userAgent?: string,
  cookies = "",
): Promise<SigiProfile> {
  const clean = username.trim().replace(/^@/, "").toLowerCase();
  const ua = userAgent ?? randomUa();
  const cookieHeader = buildCookieHeader(ttwid, cookies);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let html: string;
  try {
    const resp = await fetch(`https://www.tiktok.com/@${clean}`, {
      headers: {
        "User-Agent": ua,
        Cookie: cookieHeader,
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    html = await resp.text();
  } finally {
    clearTimeout(timer);
  }

  const jsonStr = extractSigiJson(html);
  const blob = JSON.parse(jsonStr) as Record<string, unknown>;

  const scope = blob["__DEFAULT_SCOPE__"] as Record<string, unknown> | undefined;
  const userDetail = scope?.["webapp.user-detail"] as Record<string, unknown> | undefined;
  if (!userDetail) {
    throw new ProfileScrapeError("missing __DEFAULT_SCOPE__/webapp.user-detail");
  }

  const statusCode = (userDetail.statusCode as number) ?? 0;
  if (statusCode !== 0) {
    if (statusCode === 10222) throw new ProfilePrivateError(clean);
    if (statusCode === 10221 || statusCode === 10223) throw new ProfileNotFoundError(clean);
    throw new ProfileError(statusCode);
  }

  const userInfo = userDetail.userInfo as Record<string, unknown> | undefined;
  if (!userInfo) throw new ProfileScrapeError("missing userInfo");

  const user = (userInfo.user ?? {}) as Record<string, unknown>;
  const stats = (userInfo.stats ?? {}) as Record<string, unknown>;

  const bioLinkObj = user.bioLink as Record<string, unknown> | undefined;
  let bioLink: string | null = null;
  if (bioLinkObj && typeof bioLinkObj === "object") {
    const linkVal = bioLinkObj.link as string | undefined;
    if (linkVal) bioLink = linkVal;
  }

  return {
    userId: String(user.id ?? ""),
    uniqueId: String(user.uniqueId ?? ""),
    nickname: String(user.nickname ?? ""),
    bio: String(user.signature ?? ""),
    avatarThumb: String(user.avatarThumb ?? ""),
    avatarMedium: String(user.avatarMedium ?? ""),
    avatarLarge: String(user.avatarLarger ?? ""),
    verified: Boolean(user.verified),
    privateAccount: Boolean(user.privateAccount),
    isOrganization: Number(user.isOrganization ?? 0) !== 0,
    roomId: String(user.roomId ?? ""),
    bioLink,
    followerCount: Number(stats.followerCount ?? 0),
    followingCount: Number(stats.followingCount ?? 0),
    heartCount: Number(stats.heartCount ?? 0),
    videoCount: Number(stats.videoCount ?? 0),
    friendCount: Number(stats.friendCount ?? 0),
  };
}

function extractSigiJson(html: string): string {
  const markerPos = html.indexOf(SIGI_MARKER);
  if (markerPos === -1) throw new ProfileScrapeError("SIGI script tag not found in HTML");

  const gtPos = html.indexOf(">", markerPos);
  if (gtPos === -1) throw new ProfileScrapeError("no > after SIGI marker");

  const jsonStart = gtPos + 1;
  const scriptEnd = html.indexOf("</script>", jsonStart);
  if (scriptEnd === -1) throw new ProfileScrapeError("no </script> after SIGI JSON");

  const jsonStr = html.slice(jsonStart, scriptEnd);
  if (!jsonStr) throw new ProfileScrapeError("empty SIGI JSON blob");

  return jsonStr;
}

function buildCookieHeader(ttwid: string, cookies: string): string {
  if (!cookies) return `ttwid=${ttwid}`;
  const filtered = cookies
    .split("; ")
    .filter((pair) => !pair.startsWith("ttwid="))
    .join("; ");
  if (!filtered) return `ttwid=${ttwid}`;
  return `ttwid=${ttwid}; ${filtered}`;
}

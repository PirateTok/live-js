import { randomUa, systemLocale } from "./ua.js";
import {
  fetchRoomInfoJson,
  InvalidResponseError,
  SessionRequiredError,
  timedFetch,
} from "./api.js";

export interface AudienceViewer {
  rank: number;
  score: number;
  userId: string;
  username: string;
  nickname: string;
  secUid: string;
  avatarUrl: string | null;
  followerCount: number;
  verified: boolean;
  /** Follows the streamer. */
  isFollower: boolean;
  /** The streamer follows them. */
  isFollowing: boolean;
  isSubscriber: boolean;
}

export interface RoomAudience {
  total: number;
  anonymous: number;
  viewers: AudienceViewer[];
  rawJson: string;
}

type Json = Record<string, unknown>;

/**
 * Fetch the full audience roster — every named viewer in the room (the web
 * viewer panel), not just the top-3 box (`topViewers()` on RoomUserSeq covers
 * that without cookies).
 *
 * **Login-gated:** TikTok requires session cookies (`"sessionid=xxx; sid_tt=xxx"`)
 * for this call only, or it throws `SessionRequiredError`. No ttwid or signing.
 *
 * @param anchorId  Streamer's user ID (`checkOnline().anchorId`). Omit to
 *                  resolve it from room info (one extra request).
 */
export async function fetchRoomAudience(
  roomId: string,
  anchorId: string | undefined,
  cookies: string,
  timeoutMs = 10_000,
  language?: string,
  region?: string,
  proxy?: string,
): Promise<RoomAudience> {
  const anchor = anchorId || await resolveAnchorId(roomId, timeoutMs, cookies, language, region, proxy);

  const [sysLang, sysReg] = systemLocale();
  const lang = language ?? sysLang;
  const reg = region ?? sysReg;
  const params = new URLSearchParams({
    aid: "1988",
    app_name: "tiktok_web",
    device_platform: "web_pc",
    app_language: lang,
    browser_language: `${lang}-${reg}`,
    channel: "tiktok_web",
    room_id: roomId,
    anchor_id: anchor,
  });
  const url = `https://webcast.tiktok.com/webcast/ranklist/online_audience/?${params}`;

  const headers: Record<string, string> = {
    "User-Agent": randomUa(),
    Referer: "https://www.tiktok.com/",
  };
  if (cookies) headers["Cookie"] = cookies;

  const resp = await timedFetch(url, headers, timeoutMs, proxy);
  return parseRoomAudience(await resp.text(), resp.status);
}

async function resolveAnchorId(
  roomId: string,
  timeoutMs: number,
  cookies: string,
  language?: string,
  region?: string,
  proxy?: string,
): Promise<string> {
  const info = await fetchRoomInfoJson(roomId, timeoutMs, cookies, language, region, proxy);
  const owner = (info.data as Json | undefined)?.owner as Json | undefined;
  const id = owner?.id_str;
  if (typeof id !== "string" || !id) throw new InvalidResponseError("no owner id in room info");
  return id;
}

/** Parse an `online_audience` response body. Exported for offline tests. */
export function parseRoomAudience(body: string, httpStatus: number): RoomAudience {
  if (!body) throw new InvalidResponseError(`empty response from online_audience (http ${httpStatus})`);

  let json: Json;
  try {
    json = JSON.parse(body) as Json;
  } catch (err) {
    throw new InvalidResponseError(`online_audience is not JSON (http ${httpStatus}): ${String(err)}`);
  }

  const code = json.status_code;
  if (typeof code !== "number") throw new InvalidResponseError("no status_code in online_audience response");
  if (code === 20003) {
    throw new SessionRequiredError("audience roster needs login — pass session cookies to fetchRoomAudience()");
  }
  const data = json.data as Json | undefined;
  if (code !== 0) {
    const msg = typeof data?.message === "string" ? data.message : "";
    throw new InvalidResponseError(`online_audience status_code=${code} ${msg}`);
  }
  if (!data || typeof data !== "object") throw new InvalidResponseError("missing 'data' in online_audience");

  const ranks = Array.isArray(data.ranks) ? (data.ranks as Json[]) : [];
  return {
    total: num(data.total),
    anonymous: num(data.anonymous),
    viewers: ranks.flatMap(parseViewer),
    rawJson: body,
  };
}

function parseViewer(rank: Json): AudienceViewer[] {
  const user = rank.user as Json | undefined;
  if (!user || typeof user !== "object") return [];

  const idStr = typeof user.id_str === "string" ? user.id_str : "";
  const avatar = (user.avatar_thumb as Json | undefined)?.url_list;
  const follow = user.follow_info as Json | undefined;

  return [{
    rank: num(rank.rank),
    score: num(rank.score),
    userId: idStr || String(num(user.id)),
    username: str(user.display_id),
    nickname: str(user.nickname),
    secUid: str(user.sec_uid),
    avatarUrl: Array.isArray(avatar) && typeof avatar[0] === "string" ? avatar[0] : null,
    followerCount: num(follow?.follower_count),
    verified: user.verified === true,
    isFollower: user.is_follower === true,
    isFollowing: user.is_following === true,
    isSubscriber: user.is_subscribe === true,
  }];
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

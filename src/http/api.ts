import { randomUa, systemLocale, systemTimezone } from "./ua.js";
import { proxyFetch } from "./proxy.js";

// === Error types ===

export class UserNotFoundError extends Error {
  constructor(public username: string) {
    super(`user "${username}" does not exist`);
    this.name = "UserNotFoundError";
  }
}

export class HostNotOnlineError extends Error {
  constructor(public username: string) {
    super(`user "${username}" is not currently live`);
    this.name = "HostNotOnlineError";
  }
}

export class TikTokBlockedError extends Error {
  constructor(public statusCode: number) {
    super(`tiktok blocked (HTTP ${statusCode})`);
    this.name = "TikTokBlockedError";
  }
}

export class TikTokApiError extends Error {
  constructor(public code: number) {
    super(`tiktok API error: statusCode=${code}`);
    this.name = "TikTokApiError";
  }
}

export class AgeRestrictedError extends Error {
  constructor() {
    super("age-restricted stream: 18+ room — pass session cookies to fetchRoomInfo()");
    this.name = "AgeRestrictedError";
  }
}

export class DeviceBlockedError extends Error {
  constructor() {
    super("DEVICE_BLOCKED: ttwid is blocked — rotate ttwid and user agent");
    this.name = "DeviceBlockedError";
  }
}

export class SessionRequiredError extends Error {
  constructor(public reason: string) {
    super(`session required: ${reason}`);
    this.name = "SessionRequiredError";
  }
}

export class InvalidResponseError extends Error {
  constructor(public reason: string) {
    super(`invalid response: ${reason}`);
    this.name = "InvalidResponseError";
  }
}

export class ProfilePrivateError extends Error {
  constructor(public username: string) {
    super(`profile is private: @${username}`);
    this.name = "ProfilePrivateError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(public username: string) {
    super(`profile not found: @${username}`);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileScrapeError extends Error {
  constructor(public reason: string) {
    super(`failed to scrape profile: ${reason}`);
    this.name = "ProfileScrapeError";
  }
}

export class ProfileError extends Error {
  constructor(public code: number) {
    super(`profile fetch error: statusCode=${code}`);
    this.name = "ProfileError";
  }
}

// === Types ===

export interface RoomIdResult {
  roomId: string;
  /** Streamer's user ID (`data.user.id`); empty when TikTok omits it. Feeds `fetchRoomAudience()`. */
  anchorId: string;
}

export interface RoomInfo {
  title: string;
  viewers: number;
  likes: number;
  totalUser: number;
  streamUrl: StreamUrls | null;
}

export interface StreamUrls {
  flvOrigin: string;
  flvHd: string;
  flvSd: string;
  flvLd: string;
  flvAudio: string;
}

// === API functions ===

export async function timedFetch(url: string, headers: Record<string, string>, timeoutMs: number, proxy?: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await proxyFetch(url, { headers, signal: controller.signal }, proxy);
  } finally {
    clearTimeout(timer);
  }
}

export async function checkOnline(
  username: string,
  timeoutMs = 10_000,
  language?: string,
  region?: string,
  proxy?: string,
): Promise<RoomIdResult> {
  const clean = username.trim().replace(/^@/, "");
  const [sysLang, sysReg] = systemLocale();
  const lang = language ?? sysLang;
  const reg = region ?? sysReg;
  const browserLang = `${lang}-${reg}`;
  const params = new URLSearchParams({
    aid: "1988",
    app_name: "tiktok_web",
    device_platform: "web_pc",
    app_language: lang,
    browser_language: browserLang,
    region: reg,
    user_is_login: "false",
    sourceType: "54",
    staleTime: "600000",
    uniqueId: clean,
  });
  const url = `https://www.tiktok.com/api-live/user/room?${params}`;

  const resp = await timedFetch(url, { "User-Agent": randomUa() }, timeoutMs, proxy);
  return parseCheckOnline(await resp.text(), resp.status, clean);
}

/** Map an `/api-live/user/room` response. Exported for offline tests. */
export function parseCheckOnline(body: string, httpStatus: number, clean: string): RoomIdResult {
  if (httpStatus === 403 || httpStatus === 429) {
    throw new TikTokBlockedError(httpStatus);
  }

  let result: Record<string, unknown>;
  try {
    result = JSON.parse(body);
  } catch {
    throw new TikTokBlockedError(httpStatus);
  }

  const statusCode = result.statusCode as number;
  if (statusCode === 19881007) throw new UserNotFoundError(clean);
  if (statusCode !== 0) throw new TikTokApiError(statusCode);

  const data = result.data as Record<string, Record<string, unknown>>;
  const roomId = String(data?.user?.roomId ?? "");
  if (!roomId || roomId === "0") throw new HostNotOnlineError(clean);

  const liveStatus = (data?.liveRoom?.status as number) ?? 0;
  const userStatus = (data?.user?.status as number) ?? 0;
  if (liveStatus !== 2 && userStatus !== 2) throw new HostNotOnlineError(clean);

  return { roomId, anchorId: String(data?.user?.id ?? "") };
}

export async function fetchRoomInfo(
  roomId: string,
  timeoutMs = 10_000,
  cookies = "",
  language?: string,
  region?: string,
  proxy?: string,
): Promise<RoomInfo> {
  return roomInfoFromJson(await fetchRoomInfoJson(roomId, timeoutMs, cookies, language, region, proxy));
}

/** Map a successful `/webcast/room/info/` JSON body. Exported for offline tests. */
export function roomInfoFromJson(body: Record<string, unknown>): RoomInfo {
  const data = body.data as Record<string, unknown>;
  const stats = (data?.stats ?? {}) as Record<string, unknown>;

  return {
    title: String(data?.title ?? ""),
    viewers: Number(data?.user_count ?? 0),
    likes: Number(stats?.like_count ?? 0),
    totalUser: Number(stats?.total_user ?? 0),
    streamUrl: parseStreamUrls(data?.stream_url),
  };
}

/** Raw `/webcast/room/info/` JSON after status_code mapping. */
export async function fetchRoomInfoJson(
  roomId: string,
  timeoutMs = 10_000,
  cookies = "",
  language?: string,
  region?: string,
  proxy?: string,
): Promise<Record<string, unknown>> {
  const tz = encodeURIComponent(systemTimezone());
  const [sysLang, sysReg] = systemLocale();
  const lang = language ?? sysLang;
  const reg = region ?? sysReg;
  const browserLang = `${lang}-${reg}`;
  const infoParams = new URLSearchParams({
    aid: "1988",
    app_name: "tiktok_web",
    device_platform: "web_pc",
    app_language: lang,
    browser_language: browserLang,
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "Linux x86_64",
    cookie_enabled: "true",
    screen_height: "1080",
    screen_width: "1920",
    tz_name: systemTimezone(),
    webcast_language: lang,
    room_id: roomId,
  });
  const url = `https://webcast.tiktok.com/webcast/room/info/?${infoParams}`;

  const headers: Record<string, string> = {
    "User-Agent": randomUa(),
    Referer: "https://www.tiktok.com/",
  };
  if (cookies) headers["Cookie"] = cookies;

  const resp = await timedFetch(url, headers, timeoutMs, proxy);
  return checkRoomInfoStatus(await resp.json() as Record<string, unknown>);
}

/** status_code mapping of `/webcast/room/info/`. Exported for offline tests. */
export function checkRoomInfoStatus(body: Record<string, unknown>): Record<string, unknown> {
  const statusCode = body.status_code as number;
  if (statusCode === 4003110) throw new AgeRestrictedError();
  if (statusCode !== 0) throw new TikTokApiError(statusCode);
  return body;
}

function parseStreamUrls(raw: unknown): StreamUrls | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const flv = obj.flv_pull_url as Record<string, string> | undefined;
  if (!flv || typeof flv !== "object") return null;

  return {
    flvOrigin: flv["FULL_HD1"] ?? "",
    flvHd: flv["HD1"] ?? "",
    flvSd: flv["SD1"] ?? "",
    flvLd: flv["SD2"] ?? "",
    flvAudio: flv["AUDIO"] ?? "",
  };
}

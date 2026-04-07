import { fetchTTWID } from "../auth/ttwid.js";
import {
  ProfileError,
  ProfileNotFoundError,
  ProfilePrivateError,
} from "./api.js";
import { scrapeProfile } from "./sigi.js";
import type { SigiProfile } from "./sigi.js";

const DEFAULT_TTL_MS = 300_000; // 5 minutes
const TTWID_TIMEOUT_MS = 10_000;
const SCRAPE_TIMEOUT_MS = 15_000;

interface CacheEntry {
  value: SigiProfile | Error;
  insertedAt: number;
}

export class ProfileCache {
  private entries = new Map<string, CacheEntry>();
  private ttwid: string | null = null;
  private ttlMs: number;
  private userAgent: string | undefined;
  private cookies: string;

  constructor(opts: {
    ttlMs?: number;
    userAgent?: string;
    cookies?: string;
  } = {}) {
    this.ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
    this.userAgent = opts.userAgent;
    this.cookies = opts.cookies ?? "";
  }

  async fetch(username: string): Promise<SigiProfile> {
    const key = normalizeKey(username);

    const entry = this.entries.get(key);
    if (entry && (Date.now() - entry.insertedAt) < this.ttlMs) {
      if (entry.value instanceof Error) throw entry.value;
      return entry.value;
    }

    const ttwid = await this.ensureTtwid();

    try {
      const profile = await scrapeProfile(
        key,
        ttwid,
        SCRAPE_TIMEOUT_MS,
        this.userAgent,
        this.cookies,
      );
      this.entries.set(key, { value: profile, insertedAt: Date.now() });
      return profile;
    } catch (err: unknown) {
      if (
        err instanceof ProfilePrivateError ||
        err instanceof ProfileNotFoundError ||
        err instanceof ProfileError
      ) {
        this.entries.set(key, { value: err, insertedAt: Date.now() });
      }
      throw err;
    }
  }

  cached(username: string): SigiProfile | null {
    const key = normalizeKey(username);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if ((Date.now() - entry.insertedAt) >= this.ttlMs) return null;
    if (entry.value instanceof Error) return null;
    return entry.value;
  }

  invalidate(username: string): void {
    this.entries.delete(normalizeKey(username));
  }

  invalidateAll(): void {
    this.entries.clear();
  }

  private async ensureTtwid(): Promise<string> {
    if (this.ttwid) return this.ttwid;
    this.ttwid = await fetchTTWID(TTWID_TIMEOUT_MS, this.userAgent);
    return this.ttwid;
  }
}

function normalizeKey(username: string): string {
  return username.trim().replace(/^@/, "").toLowerCase();
}

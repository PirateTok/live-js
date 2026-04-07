const USER_AGENTS: readonly string[] = [
  "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:139.0) Gecko/20100101 Firefox/139.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

/**
 * Pick a random user agent from the built-in pool.
 */
export function randomUa(): string {
  const idx = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[idx] as string;
}

/**
 * Detect the system's IANA timezone name via `Intl.DateTimeFormat`.
 * Falls back to `"UTC"` when detection fails.
 */
export function systemTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.length > 0) return tz;
  } catch (_err: unknown) {
    // Intl not available — fall back to UTC
  }
  return "UTC";
}

const FALLBACK_LANG = "en";
const FALLBACK_REGION = "US";
const SKIP_LOCALES = new Set(["C", "POSIX", ""]);

/**
 * Detect system locale as `[language, region]`.
 * Tries `LC_ALL`, then `LANG` env var (Node). Falls back to `["en", "US"]`.
 */
export function systemLocale(): [string, string] {
  if (typeof process !== "undefined" && process.env) {
    for (const v of ["LC_ALL", "LANG"]) {
      const val = (process.env[v] ?? "").trim();
      if (SKIP_LOCALES.has(val)) continue;
      const parsed = parsePosixLocale(val);
      if (parsed) return parsed;
    }
  }
  return [FALLBACK_LANG, FALLBACK_REGION];
}

export function systemLanguage(): string {
  return systemLocale()[0];
}

export function systemRegion(): string {
  return systemLocale()[1];
}

function parsePosixLocale(s: string): [string, string] | null {
  const base = s.split(".")[0] as string;
  const parts = base.replace("-", "_").split("_", 2);
  const lang = (parts[0] as string).toLowerCase();
  if (lang.length < 2) return null;
  const region = parts.length > 1 ? (parts[1] as string).toUpperCase() : FALLBACK_REGION;
  return [lang, region];
}

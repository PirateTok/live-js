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

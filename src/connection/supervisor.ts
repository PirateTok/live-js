import { DeviceBlockedError } from "../http/api.js";

/** A session that stayed up this long resets the retry budget and keeps its ttwid. */
export const HEALTHY_SESSION_MS = 30_000;
export const DEVICE_BLOCKED_DELAY_MS = 2_000;
export const MAX_BACKOFF_MS = 30_000;

/** ttwid + the UA it was minted with — reused across reconnects. */
export interface Session {
  ttwid: string;
  userAgent: string;
}

export interface ReconnectInfo {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  deviceBlocked: boolean;
}

export interface SupervisorDeps {
  /** Mint a fresh ttwid + UA. Throwing counts as a failed attempt. */
  newSession(): Promise<Session>;
  /**
   * Run one WSS connection. Calls `onOpen` once the handshake succeeds,
   * resolves on close/stale/abort, throws `DeviceBlockedError` or any other error.
   */
  runSession(session: Session, onOpen: () => void): Promise<void>;
  sleep(ms: number, signal: AbortSignal): Promise<void>;
  now(): number;
}

export interface SupervisorHooks {
  onOpen(): void;
  onReconnecting(info: ReconnectInfo): void;
  onError(err: Error): void;
}

type AttemptEnd = "healthy" | "failed" | "blocked";

export function reconnectBackoffMs(attempt: number): number {
  return Math.min(2 ** attempt * 1000, MAX_BACKOFF_MS);
}

/**
 * Reconnect loop. `maxRetries` counts consecutive failures: a healthy session
 * (≥30 s) resets the counter. The ttwid + UA are rotated only on
 * DEVICE_BLOCKED, a failed ttwid fetch, or a connection that died within 30 s.
 * Returns when `signal` aborts or the retry budget is spent.
 */
export async function superviseSessions(
  deps: SupervisorDeps,
  maxRetries: number,
  signal: AbortSignal,
  hooks: SupervisorHooks,
): Promise<void> {
  let session: Session | null = null;
  let attempt = 0;

  while (!signal.aborted) {
    let end: AttemptEnd = "failed";
    try {
      session ??= await deps.newSession();
    } catch (err) {
      hooks.onError(asError(err));
    }

    if (session && !signal.aborted) {
      const started = deps.now();
      try {
        await deps.runSession(session, hooks.onOpen);
        end = deps.now() - started >= HEALTHY_SESSION_MS ? "healthy" : "failed";
      } catch (err) {
        const healthy = deps.now() - started >= HEALTHY_SESSION_MS;
        if (err instanceof DeviceBlockedError) {
          end = "blocked";
          session = null;
        } else {
          hooks.onError(asError(err));
          end = healthy ? "healthy" : "failed";
          if (!healthy) session = null;
        }
      }
    }

    if (signal.aborted) break;

    attempt = end === "healthy" ? 1 : attempt + 1;
    if (attempt > maxRetries) break;

    const delayMs = end === "blocked" ? DEVICE_BLOCKED_DELAY_MS : reconnectBackoffMs(attempt);
    hooks.onReconnecting({ attempt, maxRetries, delayMs, deviceBlocked: end === "blocked" });
    await deps.sleep(delayMs, signal);
  }
}

export function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const onAbort = (): void => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(); }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

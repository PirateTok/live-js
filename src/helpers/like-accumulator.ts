export interface LikeStats {
  eventLikeCount: number;
  totalLikeCount: number;
  accumulatedCount: number;
  wentBackwards: boolean;
}

/**
 * Monotonizes TikTok's inconsistent `total_like_count`.
 *
 * TikTok's `total` field on like events arrives from different server shards
 * with stale values, causing backwards jumps. The `count` field (per-event
 * delta) is reliable.
 */
export class LikeAccumulator {
  private maxTotal = 0;
  private accumulated = 0;

  /**
   * Process a raw like event and return monotonized stats.
   * The event object should have: count, total
   */
  process(data: Record<string, unknown>): LikeStats {
    const count = num(data.count);
    const total = num(data.total);

    this.accumulated += count;
    const wentBackwards = total < this.maxTotal;
    if (total > this.maxTotal) this.maxTotal = total;

    return {
      eventLikeCount: count,
      totalLikeCount: this.maxTotal,
      accumulatedCount: this.accumulated,
      wentBackwards,
    };
  }

  /** Clear state. For reconnect. */
  reset(): void {
    this.maxTotal = 0;
    this.accumulated = 0;
  }
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  return 0;
}

const STALE_MS = 60_000;

export interface GiftStreakEvent {
  streakId: number;
  isActive: boolean;
  isFinal: boolean;
  eventGiftCount: number;
  totalGiftCount: number;
  eventDiamondCount: number;
  totalDiamondCount: number;
}

interface StreakEntry {
  lastRepeatCount: number;
  lastSeen: number;
}

/**
 * Tracks gift streak deltas from TikTok's running totals.
 *
 * TikTok combo gifts fire multiple events during a streak, each carrying
 * a running total in `repeatCount` (2, 4, 7, 7). This helper tracks active
 * streaks by `groupId` and computes the delta per event.
 */
export class GiftStreakTracker {
  private streaks = new Map<number, StreakEntry>();

  /**
   * Process a raw gift event and return enriched streak data with deltas.
   * The event object should have: groupId, repeatCount, repeatEnd, gift.type, gift.diamondCount
   */
  process(data: Record<string, unknown>): GiftStreakEvent {
    const groupId = num(data.groupId);
    const repeatCount = num(data.repeatCount);
    const repeatEnd = num(data.repeatEnd);

    const gift = (data.gift ?? {}) as Record<string, unknown>;
    const giftType = num(gift.type);
    const diamondPer = num(gift.diamondCount);

    const isCombo = giftType === 1;
    const isFinal = repeatEnd === 1;

    if (!isCombo) {
      return {
        streakId: groupId,
        isActive: false,
        isFinal: true,
        eventGiftCount: 1,
        totalGiftCount: 1,
        eventDiamondCount: diamondPer,
        totalDiamondCount: diamondPer,
      };
    }

    const now = Date.now();
    this.evictStale(now);

    const prev = this.streaks.get(groupId);
    const prevCount = prev ? prev.lastRepeatCount : 0;
    const delta = Math.max(repeatCount - prevCount, 0);

    if (isFinal) {
      this.streaks.delete(groupId);
    } else {
      this.streaks.set(groupId, { lastRepeatCount: repeatCount, lastSeen: now });
    }

    const rc = Math.max(repeatCount, 1);

    return {
      streakId: groupId,
      isActive: !isFinal,
      isFinal,
      eventGiftCount: delta,
      totalGiftCount: repeatCount,
      eventDiamondCount: diamondPer * delta,
      totalDiamondCount: diamondPer * rc,
    };
  }

  /** Number of currently active (non-finalized) streaks. */
  activeStreaks(): number {
    return this.streaks.size;
  }

  /** Clear all tracked state. For reconnect scenarios. */
  reset(): void {
    this.streaks.clear();
  }

  private evictStale(now: number): void {
    for (const [id, entry] of this.streaks) {
      if (now - entry.lastSeen >= STALE_MS) {
        this.streaks.delete(id);
      }
    }
  }
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  return 0;
}

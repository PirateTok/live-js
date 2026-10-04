/** Event data of `EventType.gift` (int64s arrive as strings). */
export interface GiftData {
  gift?: { type?: number | string; diamondCount?: number | string; [field: string]: unknown };
  repeatCount?: number | string;
  repeatEnd?: number | string;
  [field: string]: unknown;
}

/** Streakable gift (gift type 1) — TikTok sends running totals until `repeatEnd`. */
export function isComboGift(data: GiftData): boolean {
  return Number(data.gift?.type ?? 0) === 1;
}

/** Final event of a streak; non-combo gifts are always final. */
export function isStreakOver(data: GiftData): boolean {
  return !isComboGift(data) || Number(data.repeatEnd ?? 0) === 1;
}

/** Diamonds for this event: per-gift diamonds × max(repeatCount, 1). */
export function diamondTotal(data: GiftData): number {
  return Number(data.gift?.diamondCount ?? 0) * Math.max(Number(data.repeatCount ?? 0), 1);
}

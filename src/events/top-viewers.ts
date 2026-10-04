/** `Contributor` entry of `WebcastRoomUserSeqMessage.ranksList` (int64s arrive as strings). */
export interface Contributor {
  score?: string | number;
  user?: Record<string, unknown>;
  rank?: string | number;
  delta?: string | number;
}

/** Event data of `EventType.roomUserSeq`. */
export interface RoomUserSeqData {
  ranksList?: Contributor[];
  [field: string]: unknown;
}

/**
 * The top-viewers box next to the viewer counter (usually the top 3 by
 * contribution score). Entries without a decoded user are skipped; the rest
 * come back sorted by rank ascending. Needs no cookies — it rides the WSS feed.
 */
export function topViewers(seq: RoomUserSeqData): Contributor[] {
  return (seq.ranksList ?? [])
    .filter((c) => c.user !== undefined && c.user !== null)
    .sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0));
}

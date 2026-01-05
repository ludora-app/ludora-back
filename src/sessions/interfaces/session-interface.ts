export interface RankedFieldResult {
  uid: string;
  total_score: number;
  total_count: bigint;
  distance_val: number | null;
}

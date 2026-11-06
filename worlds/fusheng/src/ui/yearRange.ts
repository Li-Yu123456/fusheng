// 年代滑块全域——锁定 1750-2026（真实分国数据最完整的 276 年）。
// 深史估计（BC2100-1749）保留为引擎降级层，但不作为玩家可选——精准优先于广度。
export const YEAR_MIN = 1750;
export const YEAR_MAX = 2026;

export function clampYear(y: number): number {
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
}

export function yearLabel(y: number): string {
  return String(y);
}

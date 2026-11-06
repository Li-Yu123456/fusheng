// 方案 A：锁定 1990-2026（200 国寿命数据 100% 覆盖区间）
// 每个数字来自 OWID/UN 真实分国记录——精准优先于广度。
export const YEAR_MIN = 1990;
export const YEAR_MAX = 2026;

export function clampYear(y: number): number {
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
}

export function yearLabel(y: number): string {
  return String(y);
}

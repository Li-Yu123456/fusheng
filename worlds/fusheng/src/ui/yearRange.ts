// 年代滑块全局域（唯一权威）。数据驱动：world.json 覆盖 1750-2026（OWID child-mortality
// 有值起点 1751）；选了具体国家后，SetupScreen 会按该国真实记录域收窄（见 worldAdapter.countryYearRange）。
export const YEAR_MIN = 1750;
export const YEAR_MAX = 2026;

export function clampYear(y: number): number {
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
}

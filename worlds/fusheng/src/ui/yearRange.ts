// 年代滑块全域（唯一权威）。数据驱动：
//   公元前 2100 - 公元 1749：深史学术估计（无分国数据，全球/大洲均值+出处）
//   公元 1750 - 公元 2026：OWID 分国真实数据
// 选了具体国家后，SetupScreen 按该国真实记录域收窄（worldAdapter.countryYearRange）。

export const YEAR_MIN = -2100; // 青铜时代早期（深史锚点起点）
export const YEAR_MAX = 2026;  // 当下；未来不投

export function clampYear(y: number): number {
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
}

/** 年份的中文显示（-2100 → 公元前 2100） */
export function yearLabel(y: number): string {
  return y < 0 ? `公元前 ${Math.abs(y)}` : String(y);
}

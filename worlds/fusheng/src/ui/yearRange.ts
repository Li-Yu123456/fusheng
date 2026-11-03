// 年代滑块范围（唯一权威，SetupScreen 与 App 共享）。
// 为什么不是任务书里的 1930–2026——契约 §1 与 types.ts 均冻结数据为 1950–2026 逐年，
// 1930 查无数据；上限取 2012 保证玩家至少亲历一段真实历史（成年前的时代事件）。
export const YEAR_MIN = 1950;
export const YEAR_MAX = 2012;

export function clampYear(y: number): number {
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
}

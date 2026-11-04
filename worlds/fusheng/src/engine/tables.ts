// world.json 查询层：国家×年份的数据可能缺字段、缺年份（CONTRACTS §1 明确允许缺失），
// 引擎的职责是「容忍缺失并优雅降级」——所有缺失最终落到 FALLBACK 默认值，模拟永不因数据洞崩掉。
import type { WorldData, YearRow } from './types';

export interface BirthSnapshot {
  lex: number;
  childMort: number;
  fertility: number;
  schooling: number;
  gdpPc: number;
  /** 各字段在数据里是否真实存在（era 事件等可用它决定叙事口吻，M1 暂不强制） */
  present: { lex: boolean; childMort: boolean; fertility: boolean; schooling: boolean; gdpPc: boolean };
}

// 降级默认值：取「全球 1950-2020 大致中位」量级——错得不离谱比精确但崩溃好
export const FALLBACK = {
  lex: 62,
  childMort: 60,
  fertility: 4.0,
  schooling: 6,
  gdpPc: 4000,
};

type NumField = 'lex' | 'childMort' | 'fertility' | 'schooling' | 'gdpPc';

/** 精确年份行；国家或年份不存在返回 null（不猜） */
export function getYearRow(world: WorldData, country: string, year: number): YearRow | null {
  const c = world.countries[country];
  if (!c) return null;
  // 年份键是字符串，行内值可能为 null/undefined——原样返回，由 queryField 判空
  return c.years[String(year)] ?? null;
}

/**
 * 字段查询 + 线性插值：年份缺失时在「最近的前后两个有值年份」之间线性插值。
 * 为什么插值而不是取最近值：OWID 逐年表偶有缺口，出生年快照差 1-2 岁的台阶会让
 * 相邻出生年的人生分布出现人为跳变；线性插值让分布随年份平滑。
 * 边界外（早于首年/晚于末年）取端点值——外推在没有数据支撑时比猜测更危险。
 */
export function queryField(world: WorldData, country: string, year: number, field: NumField): number | null {
  const c = world.countries[country];
  if (!c) return null;
  const yearKeys = Object.keys(c.years)
    .map(Number)
    .filter((y) => Number.isFinite(y))
    .sort((x, y) => x - y);
  if (yearKeys.length === 0) return null;

  const at = (y: number): number | null => {
    const row = c.years[String(y)];
    const v = row?.[field];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };

  // 精确命中且非空
  const exact = at(year);
  if (exact !== null) return exact;

  // 找 field 有值的最近前后年份（只看年份相邻不够——该年行可能存在但此字段为 null）
  let lo = -Infinity;
  let hi = Infinity;
  for (const y of yearKeys) {
    const v = at(y);
    if (v === null) continue;
    if (y < year && y > lo) lo = y;
    if (y > year && y < hi) hi = y;
  }
  const vLo = lo === -Infinity ? null : at(lo);
  const vHi = hi === Infinity ? null : at(hi);
  if (vLo !== null && vHi !== null) {
    return vLo + ((vHi - vLo) * (year - lo)) / (hi - lo); // 线性插值
  }
  // 单侧有值 = 查询年在该字段数据域之外。数据层（管线）已对"该不该回填"做过唯一裁决
  // （BACKFILL_MAX_GAP=40），world.json 里的 null 就是裁决后的诚实输出——查询层越权
  // 回填会让 1850 年的 null 被 1900 年的值冒充，精准铁律在此必须贯通：域外即 null。
  return null;
}

/**
 * 出生时快照：一次人生只取一次（M1 死亡模型按「出生年」校准，不随历年变化——
 * 好处是分布可直接对照 OWID 出生队列预期寿命，可解释可验收）。
 */
export function birthSnapshot(world: WorldData, country: string, birthYear: number): BirthSnapshot {
  const g = (f: NumField) => queryField(world, country, birthYear, f);
  const lex = g('lex');
  const childMort = g('childMort');
  const fertility = g('fertility');
  const schooling = g('schooling');
  const gdpPc = g('gdpPc');
  // 精准铁律：lex 是死亡模型的锚点，缺它的一切数字都是编造——直接抛错，
  // 由 UI 层保证只送入该国该年有真实寿命记录的组合（worldAdapter.countryYearRange）
  if (lex === null || lex === undefined) {
    throw new Error(`无真实寿命记录：${country} ${birthYear}（换年份或换国家）`);
  }
  return {
    lex,
    childMort: childMort ?? FALLBACK.childMort,
    fertility: fertility ?? FALLBACK.fertility,
    schooling: schooling ?? FALLBACK.schooling,
    gdpPc: gdpPc ?? FALLBACK.gdpPc,
    present: {
      lex: lex !== null,
      childMort: childMort !== null,
      fertility: fertility !== null,
      schooling: schooling !== null,
      gdpPc: gdpPc !== null,
    },
  };
}

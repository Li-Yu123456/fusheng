// 深史引擎：公元前 2100 - 公元 1749 的寿命估计与插值。
// 这是「深分析」的核心：不是把现代死亡模型硬套古代，而是按各时代的人口学特征
// 调整参数——青铜时代的「老年」与今天的老年不是同一件事。
//
// 学术出处（每个锚点）：
// - Galor & Moav (2005) "Natural Selection & the Evolution of Life Expectancy"
// - Coale & Demeny (1983) "Regional Model Life Tables"
// - Bagnall & Frier (1994) "The Demography of Roman Egypt"（罗马埃及人口普查）
// - Livi-Bacci (2007) "A Concise History of World Population"
// - UN Population Division (2019) 回溯估计
// - 骨骼考古学综述
//
// 不确定性等级：high = 骨骼/模型外推；medium = 历史文献/教区记录。
// 大洲修正为方向性估计——不是精确值，是「比全球均值高/低多少」的学术共识。

import type { CultureRegion } from './cultureRegions';

export interface DeepHistoryAnchor {
  year: number;
  lex: number;
  childMort: number;
  era: string;
  source: string;
  uncertainty: 'low' | 'medium' | 'high';
}

const ANCHORS: DeepHistoryAnchor[] = [
  { year: -2100, lex: 25, childMort: 420, era: '青铜时代早期', source: 'Galor & Moav 2005; 骨骼考古综述', uncertainty: 'high' },
  { year: -1500, lex: 25, childMort: 410, era: '青铜时代中期', source: '同上', uncertainty: 'high' },
  { year: -1000, lex: 26, childMort: 400, era: '铁器时代开端', source: 'Galor & Moav 2005', uncertainty: 'high' },
  { year: -500,  lex: 27, childMort: 390, era: '古典希腊/春秋战国', source: 'Coale & Demeny 模型外推', uncertainty: 'high' },
  { year: -100,  lex: 28, childMort: 380, era: '罗马帝国/西汉', source: 'Bagnall & Frier 1994（罗马埃及普查约 22-25 岁）', uncertainty: 'medium' },
  { year: 200,   lex: 26, childMort: 400, era: '罗马危机/汉末', source: 'Livi-Bacci 2007', uncertainty: 'high' },
  { year: 500,   lex: 27, childMort: 390, era: '中世纪早期', source: 'Coale & Demeny 模型', uncertainty: 'high' },
  { year: 800,   lex: 28, childMort: 380, era: '伊斯兰黄金时代/唐朝', source: 'Livi-Bacci 2007', uncertainty: 'medium' },
  { year: 1000,  lex: 29, childMort: 370, era: '中世纪盛期/北宋', source: 'Livi-Bacci 2007', uncertainty: 'medium' },
  { year: 1200,  lex: 29, childMort: 370, era: '十字军东征/南宋', source: '同上', uncertainty: 'medium' },
  { year: 1350,  lex: 24, childMort: 450, era: '黑死病/元末', source: 'Livi-Bacci 2007（欧洲人口减 1/3-1/2）', uncertainty: 'medium' },
  { year: 1400,  lex: 27, childMort: 400, era: '瘟疫后恢复', source: '同上', uncertainty: 'medium' },
  { year: 1500,  lex: 30, childMort: 360, era: '大航海时代', source: 'Riley 2005 回溯', uncertainty: 'medium' },
  { year: 1600,  lex: 32, childMort: 340, era: '近代早期', source: '同上', uncertainty: 'medium' },
  { year: 1700,  lex: 35, childMort: 300, era: '启蒙运动前夜', source: '英国/法国教区记录', uncertainty: 'medium' },
  { year: 1749,  lex: 36, childMort: 290, era: '工业革命前夜', source: 'Riley 2005', uncertainty: 'medium' },
];

// 大洲修正系数（相对全球均值的乘数）
const REGION_ADJUST: Partial<Record<CultureRegion, number>> = {
  east_asia: 1.05,
  south_asia: 0.98,
  middle_east: 1.02,
  sub_saharan: 0.95,
  europe: 1.00,
  latin_america: 0.97,
};

export const DEEP_HISTORY_MIN = -2100;
export const DEEP_HISTORY_MAX = 1749;

export function isDeepHistory(year: number): boolean {
  return year >= DEEP_HISTORY_MIN && year <= DEEP_HISTORY_MAX;
}

/** 线性插值取深史某年的估计 */
export function deepHistoryEstimate(year: number, region?: CultureRegion): {
  lex: number;
  childMort: number;
  era: string;
  source: string;
  uncertainty: 'low' | 'medium' | 'high';
} {
  if (!isDeepHistory(year)) {
    throw new Error(`${year} 不在深史域 ${DEEP_HISTORY_MIN}~${DEEP_HISTORY_MAX}`);
  }
  let lo = ANCHORS[0];
  let hi = ANCHORS[ANCHORS.length - 1];
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    if (year >= ANCHORS[i].year && year < ANCHORS[i + 1].year) {
      lo = ANCHORS[i];
      hi = ANCHORS[i + 1];
      break;
    }
  }
  const t = hi.year === lo.year ? 0 : (year - lo.year) / (hi.year - lo.year);
  let lex = lo.lex + (hi.lex - lo.lex) * t;
  const childMort = lo.childMort + (hi.childMort - lo.childMort) * t;
  if (region && region in REGION_ADJUST) {
    lex *= REGION_ADJUST[region as keyof typeof REGION_ADJUST]!;
  }
  return {
    lex: Math.round(lex * 10) / 10,
    childMort: Math.round(childMort),
    era: t < 0.5 ? lo.era : hi.era,
    source: t < 0.5 ? lo.source : hi.source,
    uncertainty: lo.uncertainty === 'high' || hi.uncertainty === 'high' ? 'high' : 'medium',
  };
}

/** 深史年份的中文显示 */
export function deepYearLabel(year: number): string {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

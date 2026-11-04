// ============================================================================
// 世界数据适配层（集成完成）：真 world.json（worker-1 产出，29 国 × 1950-2026 逐年）。
// world.json 以动态 import 懒加载（验收 3：不阻塞首屏、独立 chunk 不进主包），
// main.tsx 在 initWorld() 完成后才挂载 React，UI 内所有消费保持同步签名。
// ============================================================================
import type { WorldData, YearRow } from '../engine/types';

// 动态加载的真数据缓存。null = 未初始化（main.tsx 的加载门保证 UI 运行期不为 null）
let worldData: WorldData | null = null;

export async function initWorld(): Promise<void> {
  if (worldData) return;
  // 为什么动态 import：vite 自动切出独立 chunk，189KB 真数据不进首包
  const mod = await import('../data/world.json');
  worldData = mod.default as unknown as WorldData;
}

export function getWorld(): WorldData {
  if (!worldData) throw new Error('world 未初始化：main.tsx 必须先 await initWorld()');
  return worldData;
}

// ---- 国籍意象文案：world.json 只有国名，「微妙暗示命运而不标难度」是 UI 叙事职责 ----
const HINTS: Record<string, string> = {
  CHN: '一场浩大叙事里的人潮',
  IND: '恒河与新世界的电话线',
  USA: '新大陆的移民船',
  NGA: '非洲的鼓点与原油',
  JPN: '从灰烬里腾起的列岛',
  BRA: '桑巴与贫民窟的斜阳',
  ETH: '高原上最古老的国度',
  DEU: '废墟上的精密',
  FRA: '街垒与葡萄园',
  GBR: '雾中的旧帝国',
  RUS: '冻土与漫长的冬天',
  BGD: '河网密布的三角洲',
  ARG: '探戈与反复的钟摆',
  AUS: '南半球的孤岛牧场',
  CAN: '枫叶与辽阔的冷',
  IDN: '万岛之国的火山灰',
  ITA: '废墟上的歌剧',
  MEX: '仙人掌与迁徙的路',
  SAU: '沙漠里新起的城',
  ZAF: '彩虹之国的裂痕',
  KOR: '汉江奇迹的快与倦',
  TUR: '两块大陆的桥头堡',
  PAK: '印度河的古与新',
  EGY: '尼罗河的旧账',
  VNM: 'S 形的国土与雨',
  PHL: '台风串起的群岛',
  THA: '微笑之国的季风',
  KEN: '草原与长跑者',
  GHA: '黄金海岸的鼓',
};
const FALLBACK_HINT = '一方水土，一方命运';

export interface CountryMeta {
  code: string;
  zh: string;
  hint: string;
}

// ---- 洲际分组：按主要领土/人口归属的主流地理口径 ----
// 三个跨洲国的归法（不瞎归，口径写明）：
//   土耳其：约 97% 领土在安纳托利亚（亚洲）→ 亚洲
//   埃及：人口与主体在西奈以西（非洲）→ 非洲
//   俄罗斯：人口与首都乌拉尔以西（欧洲）→ 欧洲
export const CONTINENTS = ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲'] as const;
export type Continent = (typeof CONTINENTS)[number];

const CONTINENT_OF: Record<string, Continent> = {
  CHN: '亚洲', IND: '亚洲', IDN: '亚洲', JPN: '亚洲', KOR: '亚洲',
  PAK: '亚洲', BGD: '亚洲', SAU: '亚洲', TUR: '亚洲', VNM: '亚洲', PHL: '亚洲', THA: '亚洲',
  FRA: '欧洲', DEU: '欧洲', GBR: '欧洲', ITA: '欧洲', RUS: '欧洲',
  NGA: '非洲', ETH: '非洲', EGY: '非洲', ZAF: '非洲', KEN: '非洲', GHA: '非洲',
  USA: '北美洲', CAN: '北美洲', MEX: '北美洲',
  BRA: '南美洲', ARG: '南美洲',
  AUS: '大洋洲',
};

/** 按洲分组的国家清单；未登记洲属的国家进「其他」绝不吞掉——写全优先于写齐 */
export function listByContinent(): { continent: string; countries: CountryMeta[] }[] {
  const all = listCountries();
  const groups = new Map<string, CountryMeta[]>();
  for (const c of all) {
    const key = CONTINENT_OF[c.code] ?? '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const known = CONTINENTS.filter((k) => groups.has(k));
  const rest = [...groups.keys()].filter((k) => !(CONTINENTS as readonly string[]).includes(k));
  return [...known, ...rest].map((continent) => ({ continent, countries: groups.get(continent)! }));
}

// ---- UI 消费的纯函数（全部查真表，容忍缺失） ----
export function listCountries(): CountryMeta[] {
  if (!worldData) return [];
  return Object.entries(worldData.countries).map(([code, v]) => ({
    code,
    zh: v.name.zh,
    hint: HINTS[code] ?? FALLBACK_HINT,
  }));
}

export function countryName(code: string): string {
  return worldData?.countries[code]?.name.zh ?? code;
}

export function getYearRow(cc: string, year: number): YearRow | null {
  // 直接查表：world.json 由管线保证 1950-2026 逐年有行（值可 null）
  return worldData?.countries[cc]?.years[String(year)] ?? null;
}

// 世界均值（出生报告「你的国家 vs 世界」叙事用）：
// 首选 OWID Entity='World' 的真实全球行；无该数据时降级为 29 国样本平均
// （并在注释与校验统计里声明——样本平均是近似，不冒充全球真值）
export function getWorldLex(year: number): number | null {
  if (!worldData) return null;
  const real = worldData.world?.years[String(year)]?.lex;
  if (real != null) return Math.round(real * 10) / 10;
  let sum = 0;
  let n = 0;
  for (const c of Object.values(worldData.countries)) {
    const lex = c.years[String(year)]?.lex;
    if (lex != null) { sum += lex; n++; }
  }
  return n > 0 ? Math.round((sum / n) * 10) / 10 : null;
}

/** 该国「有真实寿命记录」的年份域——滑块与 fate 抽样都以此为准，
 *  绝不让玩家选出一个数据为 null 的组合（那会让出生文书编数字） */
export function countryYearRange(cc: string): { min: number; max: number } | null {
  const c = worldData?.countries[cc];
  if (!c) return null;
  let min: number | null = null;
  let max: number | null = null;
  for (const y of Object.keys(c.years).map(Number).sort((a, b) => a - b)) {
    if (c.years[String(y)]?.lex != null) {
      if (min === null) min = y;
      max = y;
    }
  }
  return min === null || max === null ? null : { min, max };
}

// 终局脚注署名用（数据出处与许可）
export const WORLD_SOURCE = 'Our World in Data（CC BY 4.0）';

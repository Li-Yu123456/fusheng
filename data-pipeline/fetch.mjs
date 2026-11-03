// 浮生数据管线：OWID grapher CSV → worlds/fusheng/src/data/world.json
// 为什么零依赖：契约 §5 要求 data-pipeline 零 npm 依赖，node 原生 fetch/crypto 足够。
// 幂等：CSV 缓存到 ./cache/，重跑直接读缓存，不重复下载、哈希稳定。

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url))); // 仓库根 fusheng/
const CACHE_DIR = join(ROOT, 'data-pipeline', 'cache');
const OUT_PATH = join(ROOT, 'worlds', 'fusheng', 'src', 'data', 'world.json');

const YEAR_MIN = 1950;
const YEAR_MAX = 2026;
// 头回填信任半径：首数据点距 1950 超过 40 年（首点 >1990）时，用现代值冒充历史
// 会严重失真（如沙特 schooling 只有 2015-2020 两个点），此时诚实输出 null 让引擎降级。
// 40 年以内（如南非 childMort 从 1974 起）趋势平缓，首值回填可接受——任务规定"表内
// 无该国的年份段同样处理（延续）"，此阈值是对该规定在极端稀疏数据上的防呆收窄。
const BACKFILL_MAX_GAP = 40;

// 实际使用的 slug 与表内数值列名（2026-11-01 逐一拉取确认；fertility-rate 与
// gdp-per-capita 两个 slug 404，已换用 total-fertility-rate / gdp-per-capita-maddison，
// 后者单位为 2017 国际元 PPP，与契约 §1 gdpPc 单位一致）。
// childMort 的 factor=10：该表官方元数据 unit 为 "%"（每 100 活产，页面上
// "deaths per 100 live births"，锚点核验 JPN/SWE 2020s≈0.25%≈2.5‰），
// 契约 §1 要求每 1000 活产口径，故入表时 ×10。
const TABLES = [
  { field: 'lex', slug: 'life-expectancy', column: 'Life expectancy', decimals: 1, factor: 1 },
  { field: 'childMort', slug: 'child-mortality', column: 'Under-five mortality rate (selected)', decimals: 1, factor: 10 },
  { field: 'fertility', slug: 'total-fertility-rate', column: 'Total fertility rate', decimals: 2 },
  { field: 'schooling', slug: 'mean-years-of-schooling', column: 'Average years of schooling', decimals: 2 },
  { field: 'gdpPc', slug: 'gdp-per-capita-maddison', column: 'GDP per capita', decimals: 0 },
];

// 国家集：G20 全部成员国（EU 非国家不计）+ 非洲/南亚/东南亚代表，共 29 国 ≥ 契约下限 24。
const COUNTRIES = {
  ARG: '阿根廷', AUS: '澳大利亚', BRA: '巴西', CAN: '加拿大', CHN: '中国',
  FRA: '法国', DEU: '德国', IND: '印度', IDN: '印度尼西亚', ITA: '意大利',
  JPN: '日本', MEX: '墨西哥', RUS: '俄罗斯', SAU: '沙特阿拉伯', ZAF: '南非',
  KOR: '韩国', TUR: '土耳其', GBR: '英国', USA: '美国',
  NGA: '尼日利亚', PAK: '巴基斯坦', BGD: '孟加拉国', ETH: '埃塞俄比亚', EGY: '埃及',
  VNM: '越南', PHL: '菲律宾', THA: '泰国', KEN: '肯尼亚', GHA: '加纳',
};

async function fetchCsv(slug) {
  const cachePath = join(CACHE_DIR, `${slug}.csv`);
  const cached = await readFile(cachePath, 'utf8').catch(() => null);
  if (cached !== null) return cached; // 缓存命中：幂等重跑的关键
  const res = await fetch(`https://ourworldindata.org/grapher/${slug}.csv`, {
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`下载失败 ${slug}: HTTP ${res.status}`);
  const text = await res.text();
  await writeFile(cachePath, text);
  return text;
}

// 极简引号感知 CSV 解析：maddison 表的 Annotations 列可能含引号包裹的逗号，
// 按位置切列会把数值列切碎，所以必须逐字符走引号状态机。
function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // CSV 转义的 ""
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
}

// 表 → Map<iso3, Map<year, number>>：只收目标国、列名精确匹配的数值单元格。
// Entity === 'World' 的真实全球行单独收进 '__world__' 键（Code 为空但它是真数据，
// 出生文书"世界均值"叙事必须用真全球值，不能用 29 国样本平均冒充——那是伪精确）。
// 其余 Code 为空的聚合实体（continent 等）仍忽略。
// factor：源表单位 → 契约单位的换算系数（见 TABLES 注释）。
const WORLD_KEY = '__world__';
function extractSeries(csvText, columnName, factor = 1) {
  const lines = csvText.split('\n');
  const header = parseCsvLine(lines[0]);
  const iEntity = header.indexOf('Entity');
  const iCode = header.indexOf('Code');
  const iYear = header.indexOf('Year');
  const iValue = header.indexOf(columnName);
  if (iEntity < 0 || iCode < 0 || iYear < 0 || iValue < 0) {
    throw new Error(`表头缺少预期列 ${columnName}（实际表头: ${header.join('|')}）`);
  }
  const wanted = new Set(Object.keys(COUNTRIES));
  const series = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = parseCsvLine(line);
    const code = cells[iCode];
    const isWorld = cells[iEntity] === 'World';
    if (isWorld) {
      // World 行：真实全球聚合，收进专用键
    } else if (!code || !wanted.has(code)) {
      continue;
    }
    const raw = cells[iValue];
    if (raw === '' || raw == null) continue; // 缺测单元格不进序列，交给插值/延续
    const value = Number(raw);
    const year = Number(cells[iYear]);
    if (!Number.isFinite(value) || !Number.isFinite(year)) continue;
    const key = isWorld ? WORLD_KEY : code;
    if (!series.has(key)) series.set(key, new Map());
    const countryYears = series.get(key);
    if (!countryYears.has(year)) countryYears.set(year, value * factor); // 同年重复行取首个有效值
  }
  return series;
}

// 单国单字段 → 1950..2026 逐年值。规则（任务规定）：
//   有测点用测点；两点之间线性插值；表尾之后用最后有效值延续；
//   表头之前首值回填（受 BACKFILL_MAX_GAP 防呆限制）；完全无数据 → null。
// 返回 { values: Map<year, number|null>, stats: {observed, interpolated, tail, head, null} }
function buildSeries(pointsByYear) {
  const values = new Map();
  const stats = { observed: 0, interpolated: 0, tail: 0, head: 0, null: 0 };
  const years = [...pointsByYear.keys()].sort((a, b) => a - b);
  const noData = years.length === 0;
  const firstYear = noData ? null : years[0];
  const lastYear = noData ? null : years[years.length - 1];
  const allowHeadBackfill = !noData && firstYear - YEAR_MIN <= BACKFILL_MAX_GAP;

  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    if (pointsByYear.has(y)) {
      values.set(y, pointsByYear.get(y));
      stats.observed++;
    } else if (!noData && y > lastYear) {
      values.set(y, pointsByYear.get(lastYear)); // 尾延续：最近观测代表当前状态
      stats.tail++;
    } else if (!noData && y < firstYear) {
      if (allowHeadBackfill) {
        values.set(y, pointsByYear.get(firstYear)); // 头回填：早期段用首观测近似
        stats.head++;
      } else {
        values.set(y, null); // 首点太晚，回填必失真 → null 交引擎降级
        stats.null++;
      }
    } else if (!noData) {
      // 区间内插值：schooling 是 5 年间隔表，这是它的主路径
      let lo = y, hi = y;
      while (lo >= YEAR_MIN && !pointsByYear.has(lo)) lo--;
      while (hi <= YEAR_MAX && !pointsByYear.has(hi)) hi++;
      if (lo < firstYear) lo = firstYear; // 防御：插值锚点不越出数据域
      if (hi > lastYear) hi = lastYear;
      const vLo = pointsByYear.get(lo);
      const vHi = pointsByYear.get(hi);
      if (lo < firstYear || hi > lastYear || vLo === undefined || vHi === undefined) {
        values.set(y, null);
        stats.null++;
      } else {
        const t = (y - lo) / (hi - lo);
        values.set(y, vLo + (vHi - vLo) * t);
        stats.interpolated++;
      }
    } else {
      values.set(y, null);
      stats.null++;
    }
  }
  return { values, stats };
}

const round = (v, decimals) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(dirname(OUT_PATH), { recursive: true });

  const tablesMeta = {};
  const perTable = {}; // field → Map<iso3, {values, stats}>
  for (const t of TABLES) {
    const csvText = await fetchCsv(t.slug);
    // sha256 记录的是真实下载（或缓存）的原始 CSV 字节，供溯源比对
    tablesMeta[t.slug] = 'sha256:' + createHash('sha256').update(csvText, 'utf8').digest('hex');
    perTable[t.field] = {};
    const series = extractSeries(csvText, t.column, t.factor);
    for (const iso3 of Object.keys(COUNTRIES)) {
      const points = series.get(iso3) ?? new Map();
      perTable[t.field][iso3] = buildSeries(points);
    }
    perTable[t.field][WORLD_KEY] = buildSeries(series.get(WORLD_KEY) ?? new Map());
  }

  // 组装 world.json：键序（国家→年份→字段）按升序写入，产物字节稳定，
  // ?seed=42 回归与 gzip 体积都受益于确定性输出。
  const countriesOut = {};
  const fields = TABLES.map((t) => t.field);
  const decimalsByField = Object.fromEntries(TABLES.map((t) => [t.field, t.decimals]));
  const missingByField = Object.fromEntries(fields.map((f) => [f, 0]));
  const rowTotals = Object.fromEntries(fields.map((f) => [f, 0]));

  for (const iso3 of Object.keys(COUNTRIES).sort()) {
    const yearsOut = {};
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      const row = {};
      for (const f of fields) {
        const v = perTable[f][iso3].values.get(y);
        if (v === null || v === undefined) {
          row[f] = null;
          missingByField[f]++;
        } else {
          row[f] = round(v, decimalsByField[f]);
        }
        rowTotals[f]++;
      }
      yearsOut[String(y)] = row;
    }
    countriesOut[iso3] = { name: { zh: COUNTRIES[iso3] }, years: yearsOut };
  }

  const world = {
    meta: {
      source: 'Our World in Data grapher CSV',
      license: 'CC-BY 4.0',
      fetchedAt: new Date().toISOString().slice(0, 10),
      tables: tablesMeta,
    },
    countries: countriesOut,
  };

  // 真实全球行（Entity='World'）：出生文书"世界均值"用真数据，非样本平均
  const worldYears = {};
  let worldRows = 0;
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    const row = {};
    let any = false;
    for (const t of TABLES) {
      const built = perTable[t.field][WORLD_KEY];
      const v = built ? built.values.get(y) : null;
      row[t.field] = v === null || v === undefined ? null : round(v, t.decimals);
      if (row[t.field] !== null) any = true;
    }
    if (any) worldRows++;
    worldYears[String(y)] = row;
  }
  if (worldRows > 0) {
    world.world = { years: worldYears };
    console.log(`\n真实全球行（Entity=World）: ${worldRows}/${YEAR_MAX - YEAR_MIN + 1} 年有值`);
  }
  await writeFile(OUT_PATH, JSON.stringify(world) + '\n', 'utf8');

  // ---- 校验统计（stdout） ----
  const nCountries = Object.keys(COUNTRIES).length;
  const nYears = YEAR_MAX - YEAR_MIN + 1;
  console.log(`world.json → ${OUT_PATH}`);
  console.log(`国家数: ${nCountries}，年份 ${YEAR_MIN}–${YEAR_MAX}（${nYears} 年/国，共 ${nCountries * nYears} 行）`);
  console.log(`实际使用 slug: ${TABLES.map((t) => `${t.field}=${t.slug}`).join(', ')}`);
  console.log('\n各字段来源构成（全国家合计）与缺失率:');
  for (const t of TABLES) {
    const agg = { observed: 0, interpolated: 0, tail: 0, head: 0, null: 0 };
    for (const iso3 of Object.keys(COUNTRIES)) {
      const s = perTable[t.field][iso3].stats;
      for (const k of Object.keys(agg)) agg[k] += s[k];
    }
    const pct = (n) => ((n / (nCountries * nYears)) * 100).toFixed(1) + '%';
    console.log(
      `  ${t.field.padEnd(10)} 观测 ${String(agg.observed).padStart(5)} (${pct(agg.observed)})  插值 ${String(agg.interpolated).padStart(5)} (${pct(agg.interpolated)})  尾延续 ${String(agg.tail).padStart(5)} (${pct(agg.tail)})  头回填 ${String(agg.head).padStart(5)} (${pct(agg.head)})  null ${String(agg.null).padStart(5)} (${pct(agg.null)})`,
    );
  }
  console.log('\n抽样（CHN 1995 / NGA 1990 / ZAF 1960）:');
  for (const [iso3, y] of [['CHN', 1995], ['NGA', 1990], ['ZAF', 1960]]) {
    console.log(`  ${iso3} ${y}: ${JSON.stringify(world.countries[iso3].years[String(y)])}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

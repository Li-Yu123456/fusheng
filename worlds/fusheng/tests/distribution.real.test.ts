import { describe, expect, it } from 'vitest';
import { simulate } from '../src/engine/life';
import world from '../src/data/world.json';
import type { WorldData } from '../src/engine/types';

// 真实数据分布检验（验收核心，lead 指定的汇报必需项）：
// CHN/JPN/NGA × 1950/1990/2020 共 9 组合，各 10000 次模拟死亡年龄均值 vs OWID lex，
// 误差 <2% 达标。mock 版引擎单元测试见 distribution.test.ts（不依赖外部数据）。
const realWorld = world as unknown as WorldData;
const N = 10_000;

const combos: { country: string; year: number }[] = [
  { country: 'CHN', year: 1950 },
  { country: 'CHN', year: 1990 },
  { country: 'CHN', year: 2020 },
  { country: 'JPN', year: 1950 },
  { country: 'JPN', year: 1990 },
  { country: 'JPN', year: 2020 },
  { country: 'NGA', year: 1950 },
  { country: 'NGA', year: 1990 },
  { country: 'NGA', year: 2020 },
];

describe('真实 OWID world.json 分布检验', () => {
  it.each(combos)('$country $year：10000 次死亡年龄均值 vs OWID lex 误差 <2%', ({ country, year }) => {
    let sum = 0;
    let sumSq = 0;
    let lex = 0;
    for (let i = 0; i < N; i++) {
      const r = simulate({ seed: 7000000 + i, country, birthYear: year, gender: i % 2 ? 'm' : 'f' }, realWorld);
      sum += r.deathAge;
      sumSq += r.deathAge * r.deathAge;
      lex = r.summary.vsLex.bornCountryLex;
    }
    const mean = sum / N;
    const sd = Math.sqrt(Math.max(0, sumSq / N - mean * mean));
    const errPct = ((mean - lex) / lex) * 100;
    console.log(`[realworld] ${country} ${year}: mean=${mean.toFixed(2)} lex=${lex} sd=${sd.toFixed(1)} err=${errPct.toFixed(2)}%`);
    expect(Math.abs(errPct)).toBeLessThan(2);
  });

  // lead 特别要求：NGA/ETH schooling 全段 null、SAU/VNM 大部分 null——降级路径必须被测试覆盖。
  // 单个 seed 在高早夭国可能 0 岁夭折（0 事件是合法分布），故用一组 seed 断言聚合性质。
  it('schooling 全 null 国（NGA/ETH/SAU/VNM）走降级路径：不崩、结构合法、事件链可成形', () => {
    for (const country of ['NGA', 'ETH', 'SAU', 'VNM']) {
      let anyGrown = false;
      let anyEducation = false;
      for (let s = 0; s < 16; s++) {
        const r = simulate({ seed: 4100 + s, country, birthYear: 1985, gender: 'f' }, realWorld);
        // 每次模拟（含早夭）都必须结构合法。deathAge 一位小数舍入后 0.0 = 出生即夭，合法
        expect(r.summary.vsLex.bornCountryLex).toBeGreaterThan(0);
        expect(r.summary.deathAge).toBeGreaterThanOrEqual(0);
        expect(r.events.every((e) => e.year === 1985 + e.age)).toBe(true);
        if (r.events.length > 10) anyGrown = true;
        if (r.events.some((e) => e.domain === 'education')) anyEducation = true;
      }
      // 16 个 seed 里至少有活出完整事件链的（lex>45 的国家 16 连早夭概率 <2^... 不可能全灭）
      expect(anyGrown).toBe(true);
      // 降级不等于停摆：FALLBACK schooling=6 支撑学龄积累，教育域事件仍应出现
      expect(anyEducation).toBe(true);
    }
  });
});

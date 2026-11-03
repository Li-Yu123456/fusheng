import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { simulate } from '../src/engine/life';
import type { WorldData } from '../src/engine/types';

// 分布检验（验收核心）：mock world 的 lex 已知且逐年常量，10000 次模拟的死亡年龄均值
// 必须 ≈ lex（±2%）。选 lex 差异最大的三档（52 / 69.8 / 81）——跨越「最穷→最富」光谱，
// 校准若在高早夭段或高长寿段失衡都会在这里现形。
const mock = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/mock-world.json', import.meta.url)), 'utf-8'),
) as WorldData;

const N = 10_000;

function meanDeathAge(country: string, birthYear: number, gender: 'm' | 'f'): { mean: number; lex: number; sd: number } {
  let sum = 0;
  let sumSq = 0;
  let lex = 0;
  for (let i = 0; i < N; i++) {
    const r = simulate({ seed: 900000 + i, country, birthYear, gender }, mock);
    sum += r.deathAge;
    sumSq += r.deathAge * r.deathAge;
    lex = r.summary.vsLex.bornCountryLex;
  }
  const mean = sum / N;
  return { mean, lex, sd: Math.sqrt(sumSq / N - mean * mean) };
}

describe('寿命分布 vs lex（mock world，10000 次/组）', () => {
  const cases: { country: string; year: number; gender: 'm' | 'f'; label: string }[] = [
    { country: 'NGA', year: 1990, gender: 'm', label: 'NGA 1990（高早夭低收入）' },
    { country: 'CHN', year: 1995, gender: 'm', label: 'CHN 1995（中等）' },
    { country: 'JPN', year: 1990, gender: 'f', label: 'JPN 1990（高收入长寿）' },
  ];

  for (const c of cases) {
    it(`${c.label} 均值误差 < 2%`, () => {
      const { mean, lex, sd } = meanDeathAge(c.country, c.year, c.gender);
      const errPct = ((mean - lex) / lex) * 100;
      // eslint-disable-next-line no-console
      console.log(`[distribution] ${c.label}: mean=${mean.toFixed(2)} lex=${lex} sd=${sd.toFixed(1)} err=${errPct.toFixed(2)}%`);
      expect(Math.abs(errPct)).toBeLessThan(2);
    });
  }
});

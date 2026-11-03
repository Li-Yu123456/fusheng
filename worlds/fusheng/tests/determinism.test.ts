import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { simulate } from '../src/engine/life';
import type { WorldData } from '../src/engine/types';

const mock = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/mock-world.json', import.meta.url)), 'utf-8'),
) as WorldData;

describe('确定性（纯函数契约）', () => {
  it('同参数两次调用 → 完整 LifeResult 逐字节一致', () => {
    const a = simulate({ seed: 42, country: 'CHN', birthYear: 1995, gender: 'm' }, mock);
    const b = simulate({ seed: 42, country: 'CHN', birthYear: 1995, gender: 'm' }, mock);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('不同 seed → 事件序列不同', () => {
    const a = simulate({ seed: 42, country: 'CHN', birthYear: 1995, gender: 'm' }, mock);
    const b = simulate({ seed: 43, country: 'CHN', birthYear: 1995, gender: 'm' }, mock);
    expect(JSON.stringify(a.events)).not.toBe(JSON.stringify(b.events));
  });

  it('时代事件一生只讲一遍（era 域事件 id 不得重复）', () => {
    // 真实数据长人生跨多个时代窗口——era 是叙事骨架，重讲即事故
    for (const seed of [42, 7, 2026]) {
      const r = simulate({ seed, country: 'CHN', birthYear: 1950, gender: 'f' }, mock);
      const eraIds = r.events.filter((e) => e.domain === 'era').map((e) => e.id);
      expect(new Set(eraIds).size, `seed=${seed} era 重复: ${eraIds.join(',')}`).toBe(eraIds.length);
    }
  });

  it('不同国家/性别也走各自命运（状态与死亡年龄可差可同，但序列结构有效）', () => {
    for (const [country, gender] of [['NGA', 'f'], ['JPN', 'f'], ['CHN', 'f']] as const) {
      const r = simulate({ seed: 42, country, birthYear: 1970, gender }, mock);
      expect(r.events.length).toBeGreaterThan(0);
      expect(r.deathAge).toBeGreaterThan(0);
      expect(r.input).toEqual({ seed: 42, country, birthYear: 1970, gender });
    }
  });

  it('国家数据缺失也不崩（降级路径）', () => {
    const r = simulate({ seed: 42, country: 'ZZZ', birthYear: 1995, gender: 'm' }, mock);
    expect(r.events.length).toBeGreaterThan(0);
    expect(r.summary.vsLex.bornCountryLex).toBeGreaterThan(0);
  });
});

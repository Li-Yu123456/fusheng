import { describe, expect, it } from 'vitest';
import { simulate } from '../src/engine/life';
import world from '../src/data/world.json';
import type { WorldData } from '../src/engine/types';

// 黄金快照：seed=42/CHN/1995/m 锚定在【真实 OWID world.json】上（lead 指令）——
// 数据更新导致快照漂移时，须人工核对差异来源后再 `-u` 更新，不得盲目刷新。
const realWorld = world as unknown as WorldData;

const life = simulate({ seed: 42, country: 'CHN', birthYear: 1995, gender: 'm' }, realWorld);

describe('黄金快照 seed=42/CHN/1995/m（真实 world.json）', () => {
  it('事件序列快照', () => {
    expect(life.events).toMatchSnapshot();
  });

  it('终局摘要快照', () => {
    expect(life.summary).toMatchSnapshot();
  });

  it('契约硬指标：≥40 事件、≥3 抉择点、6 域全覆盖', () => {
    expect(life.events.length).toBeGreaterThanOrEqual(40);
    const choices = life.events.filter((e) => e.choice);
    expect(choices.length).toBeGreaterThanOrEqual(3);
    expect(life.summary.stats.domainsTouched.length).toBe(6);
  });

  it('事件结构合法（年龄/年份联动、effects 范围）', () => {
    for (const e of life.events) {
      expect(e.year).toBe(1995 + e.age);
      expect(e.text.length).toBeGreaterThan(4);
      if (e.effects) {
        for (const v of Object.values(e.effects)) {
          if (typeof v === 'number') expect(Math.abs(v)).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('era 事件必带 dataSource', () => {
    for (const e of life.events.filter((e) => e.domain === 'era')) {
      expect(e.dataSource).toBeTruthy();
    }
  });

  it('文案可读性：无未插值的占位符残留', () => {
    for (const e of life.events) {
      expect(e.text).not.toMatch(/\{(name|partner|child)\}/);
    }
  });
});

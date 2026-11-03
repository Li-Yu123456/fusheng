import { describe, expect, it } from 'vitest';
import { birthSnapshot, FALLBACK, queryField } from '../src/engine/tables';
import type { WorldData } from '../src/engine/types';

// 构造带缺口的迷你世界：验证插值与降级而非数据本身
const mini: WorldData = {
  meta: { source: 't', license: 't', fetchedAt: 't', tables: {} },
  countries: {
    XAA: {
      name: { zh: '测试国甲' },
      years: {
        '2000': { lex: 60, childMort: 40, fertility: 3, schooling: 6, gdpPc: 2000 },
        '2010': { lex: 70, childMort: 20, fertility: 2.5, schooling: null, gdpPc: null },
      },
    },
  },
};

describe('tables 查询层', () => {
  it('精确年份直接命中', () => {
    expect(queryField(mini, 'XAA', 2000, 'lex')).toBe(60);
  });

  it('缺失年份在锚点间线性插值（2005 → 65）', () => {
    expect(queryField(mini, 'XAA', 2005, 'lex')).toBeCloseTo(65, 6);
  });

  it('字段级缺失也参与插值：schooling 2010 行内为 null → 用 2000 端点值填充估计', () => {
    // 语义选择：行存在但字段为 null 时视为「数据洞」，由最近有值年份填充——
    // 对模拟而言，十年前的观测值仍优于全局 FALLBACK
    expect(queryField(mini, 'XAA', 2005, 'schooling')).toBe(6);
    expect(queryField(mini, 'XAA', 2010, 'schooling')).toBe(6);
  });

  it('范围外取端点值（1950 早于首锚 → 60；2030 晚于末锚 → 70）', () => {
    expect(queryField(mini, 'XAA', 1950, 'lex')).toBe(60);
    expect(queryField(mini, 'XAA', 2030, 'lex')).toBe(70);
  });

  it('未知国家 → null，birthSnapshot 全降级到 FALLBACK 且标记缺失', () => {
    const snap = birthSnapshot(mini, 'ZZZ', 2000);
    expect(snap.lex).toBe(FALLBACK.lex);
    expect(snap.childMort).toBe(FALLBACK.childMort);
    expect(snap.present.lex).toBe(false);
  });

  it('birthSnapshot 标记真实存在字段', () => {
    const snap = birthSnapshot(mini, 'XAA', 2005);
    expect(snap.present.lex).toBe(true);
    expect(snap.present.gdpPc).toBe(true); // 2005 处 gdpPc 由 2000 端点值降级而来
  });
});

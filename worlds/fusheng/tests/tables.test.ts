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
        '1990': { lex: null, childMort: null, fertility: null, schooling: null, gdpPc: null }, // 管线对无记录年的诚实输出
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

  it('域内数据洞插值、域外诚实 null（schooling 2010 为末年 null → null 交 FALLBACK）', () => {
    // 精准铁律（2026-11-04 起）：查询层只做域内插值，域外/无锚一律 null——
    // 数据层是回填裁决的唯一事实源，查询层回填曾让 1850 的 null 被 1900 冒充
    // 2005 与 2010 的 schooling：只有 2000 一个有值锚（单侧），按"域外不猜"均为 null
    expect(queryField(mini, 'XAA', 2005, 'schooling')).toBeNull();
    expect(queryField(mini, 'XAA', 2010, 'schooling')).toBeNull();
  });

  it('数据域外 → null（域外不猜，数据层已做过回填裁决）', () => {
    expect(queryField(mini, 'XAA', 1950, 'lex')).toBeNull();
    expect(queryField(mini, 'XAA', 2030, 'lex')).toBeNull();
  });

  it('未知国家/无记录年份 → 抛精准铁律错误（绝不编造 lex）', () => {
    // 精准铁律：lex 是死亡模型锚点，缺它的一切数字都是编造——抛错由 UI 层换组合
    expect(() => birthSnapshot(mini, 'ZZZ', 2000)).toThrow(/无真实寿命记录/);
    expect(() => birthSnapshot(mini, 'XAA', 1990)).toThrow(/无真实寿命记录/); // 无记录年（数据层诚实 null，引擎拒绝编造）
  });

  it('birthSnapshot 标记真实存在字段', () => {
    const snap = birthSnapshot(mini, 'XAA', 2005);
    expect(snap.present.lex).toBe(true); // lex 两年有值，2005 域内插值 ✅ 真实
    expect(snap.present.gdpPc).toBe(false); // gdpPc 仅 2000 单侧有值 → null → FALLBACK 兜底（非真实）
    expect(snap.present.schooling).toBe(false); // 同上
  });
});

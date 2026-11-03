import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/engine/rng';

describe('makeRng (mulberry32)', () => {
  it('同种子 → 序列逐项一致', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 1000 }, () => a());
    const seqB = Array.from({ length: 1000 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('值域 [0,1)：100 万次抽样不含越界值', () => {
    const rng = makeRng(7);
    let min = 1, max = 0;
    for (let i = 0; i < 1_000_000; i++) {
      const v = rng();
      if (v < 0 || v >= 1) throw new Error(`越界值 ${v}`);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    // 均匀性粗检：极值应逼近端点（mulberry32 的 2^-32 网格上 100 万抽样足够贴近）
    expect(min).toBeLessThan(0.001);
    expect(max).toBeGreaterThan(0.999);
  });

  it('不同种子 → 序列不同', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const seqA = Array.from({ length: 16 }, () => a());
    const seqB = Array.from({ length: 16 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('负数/浮点种子归一为稳定起始态（ToInt32 截断语义）', () => {
    // >>>0 先做 ToInt32：-42.7 截断为 -42，两者同起始态是 32 位种子语义，而非缺陷
    const a = makeRng(-42);
    const b = makeRng(-42.7);
    expect(Array.from({ length: 8 }, () => a())).toEqual(Array.from({ length: 8 }, () => b()));
    expect(makeRng(-42)()).toBe(makeRng(-42)());
    expect(makeRng(-43)()).not.toBe(makeRng(-42)());
  });
});

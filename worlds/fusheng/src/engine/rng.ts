// 种子随机源：mulberry32。
// 为什么选它：32 位整数种子、实现极短、单流够快，且分布均匀性与序列质量对人生模拟绰绰有余
// （我们要的是「同种子同人生」的确定性与可回归性，不是密码学强度）。

export function makeRng(seed: number): () => number {
  // >>>0 把任意 number 归一为 uint32——负数/浮点种子也能得到稳定起始态
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    // 除以 2^32 保证落在 [0,1)，开区间上界——死亡判断 u < h 才不会把 1.0 误判进去
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

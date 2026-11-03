// ============================================================================
// 死亡模型与校准（本引擎的数学心脏）
//
// 两段式：
//   ① 0-4 岁：childMort（每 1000 活产的 5 岁前死亡数）均摊到 5 年
//      q5 = childMort/1000；逐年死亡概率 p = 1-(1-q5)^(1/5)（等 hazard 均摊）。
//   ② ≥5 岁：Gompertz μ(a) = B·exp(k·a)，斜率 k 固定（人类成年死亡率约每年
//      递增 8-10%，取 0.09 这一经典经验值），只校准水平参数 B。
//
// ── 校准推导（验收核心，勿改逻辑前先读懂）─────────────────────────────────
// OWID 的 lex 是「出生时预期寿命」，含早夭。记 q5 为 5 岁前死亡概率，则
//      lex = q5·E[A | A<5] + (1-q5)·(5 + e5)         …… 全概率分解
// 其中 E[A|A<5] 用①段模型自身计算（自洽，不引入外部假设）：
//      E[A|A<5] = Σ_{a=0..4} S(a)·p·(a + p/2) / q5   （年内死亡年龄 = a+u，u<p 均匀）
// 反解出 5 岁条件预期寿命：
//      e5 = (lex - q5·E[A|A<5]) / (1-q5) - 5
// 再解 B 使 Gompertz 段的期望恰好等于 e5。
// （实现口径注意：下文 meanAt 产出的是「5 岁存活者的平均死亡年龄」= 5+e5，
//   校准目标须与其同口径，见 calibrateMortality 内注释。）
//
// ── 为什么用「离散年度生命表」而非连续闭式 ────────────────────────────────
// 模拟是逐年掷骰的：h(a) = 1 - exp(-∫μ)。校准时用同一张离散表算均值
//      mean(B) = Σ_{a≥5} S(a)·h(a)·(a + h(a)/2)
// 并二分求 B。校准与模拟共享同一数学 ⇒ 蒙特卡洛均值自动吻合 lex，
// 不存在连续寿命分布 vs 离散模拟的系统性偏差（那正是常见的 1-3% 隐性误差来源）。
// ============================================================================

export const MAX_AGE = 120; // 表上限：极少数人被强制「寿终」，模拟保证终止
const K = 0.09; // Gompertz 斜率：ln(≈1.094)/年，成年死亡率年增 ~9% 的经典值

export interface MortalityModel {
  /** 0-4 岁逐年死亡概率（五年相同） */
  pChild: number;
  /** hazard[a] = a 岁生日→a+1 岁生日间的死亡概率；hazard[0..4]=pChild，hazard[MAX_AGE]=1 */
  hazard: number[];
}

/** 求给定 B 下离散生命表的 5 岁起条件均值（与 life.ts 逐年模拟同一数学） */
function meanAt(B: number): number {
  let surv = 1;
  let sum = 0;
  for (let a = 5; a < MAX_AGE; a++) {
    // 逐年死亡概率：1 - exp(-∫_a^{a+1} B·e^{k·t} dt) = 1 - exp(-(B/k)(e^{k(a+1)} - e^{ka}))
    const h = 1 - Math.exp((-B / K) * (Math.exp(K * (a + 1)) - Math.exp(K * a)));
    sum += surv * h * (a + h / 2); // 年内死亡年龄 = a+u (u<h 均匀) ⇒ 期望 a + h/2
    surv *= 1 - h;
    if (surv < 1e-13) break;
  }
  return sum + surv * MAX_AGE; // 幸存到表尾者按 MAX_AGE 寿终计
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function calibrateMortality(lex: number, childMort: number): MortalityModel {
  // ① 早夭段。childMort 上限钳到 999‰——历史最差年份也不会 ≥1000
  const q5 = clamp(childMort / 1000, 0, 0.999);
  const pChild = 1 - Math.pow(1 - q5, 1 / 5);

  let surv = 1;
  let earlySum = 0; // Σ S(a)·p·(a+p/2) = q5·E[A|A<5]
  for (let a = 0; a < 5; a++) {
    earlySum += surv * pChild * (a + pChild / 2);
    surv *= 1 - pChild;
  }
  const surv5 = 1 - q5;

  // e5 反解。注意口径：meanAt 返回「5 岁存活者的平均死亡年龄」（绝对年龄，含 5 岁基数），
  // 所以这里直接用 (lex - 早夭贡献)/surv5，不减 5——两端口径必须一致，否则 B 系统性偏小
  //（第一次实现就在这里踩过坑：减了 5 导致全人群多活 surv5×5 年，误差 ~5-9%）。
  let e5 = (lex - earlySum) / surv5;
  // 极端数据钳到 Gompertz 段可达范围：下界 9（5 岁后平均再活 4 年），上界 97
  e5 = clamp(e5, 9, 97);

  // ② Gompertz 段：mean(B) 随 B 单调下降，二分 60 次足够收敛到 <1e-10 岁
  let lo = 1e-10;
  let hi = 5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (meanAt(mid) > e5) lo = mid;
    else hi = mid;
  }
  const B = (lo + hi) / 2;

  const hazard = new Array<number>(MAX_AGE + 1).fill(pChild);
  for (let a = 5; a < MAX_AGE; a++) {
    hazard[a] = 1 - Math.exp((-B / K) * (Math.exp(K * (a + 1)) - Math.exp(K * a)));
  }
  hazard[MAX_AGE] = 1; // 表尾必死 ⇒ 循环必然终止
  return { pChild, hazard };
}

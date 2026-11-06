// 人生主循环：simulate 是纯函数——一切随机性都流经 makeRng(seed) 单流，
// 无 Math.random / Date.now / 外部状态，这是黄金快照与确定性测试成立的前提。
import { makeRng } from './rng';
import { birthSnapshot, type BirthSnapshot } from './tables';
import { calibrateMortality, MAX_AGE } from './mortality';
import { makeName } from './names';
import { ALL_EVENTS, type EventContext, type EventTemplate } from './events';
import { isDeepHistory, deepHistoryEstimate } from './deepHistory';
import { cultureOf } from './cultureRegions';
import type { LifeEvent, LifeInput, LifeResult, LifeState, WorldData } from './types';

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

// 事件节奏：主事件 0.82/年 + 次事件 0.18/年。为什么高于「每 1-3 年一个」的字面下限：
// lex≈70 的人生要稳定拿到 40+ 事件，期望频次须 ~0.85/年；短命人生事件自然少（真实感优先于硬凑数）
const P_MAIN = 0.82;
const P_SECOND = 0.18;
const RECENT_WINDOW = 24; // 近期去重窗口：避免同一事件在短人生里刷屏
const ERA_CHANCE = 0.9; // era 锚点事件近乎必触发（时间窗口本来就窄，错过即失真）

function pickCause(rng: () => number, age: number, health: number): string {
  // 死因按年龄段抽样：口径是叙事分类而非医学证明——终局报告要的是命运感
  const one = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  if (age < 5) return one(['早夭于襁褓', '没能扛过童年的第一场大病', '急症，来得比医生快']);
  if (age < 40) return one(['一场意外', '急病，没能等到确诊单', '积劳成疾']);
  if (age < 65) return health < 30 ? '久病之后，油尽灯枯' : one(['心血管疾病', '癌症', '脏器衰竭']);
  return one(['寿终正寝，睡梦中最长的一觉', '器官安然退场', '无疾而终，像一盏灯自己暗了']);
}

export function simulate(input: LifeInput, world: WorldData): LifeResult {
  const rng = makeRng(input.seed);

  // 数据分层：公元前 2100-1749 深史学术估计 → 1750+ OWID 真实分国数据。
  // 过渡期处理：部分国家的真实数据起点晚于 1750（如中国 1950 起、大多数非洲国家 1950 起），
  // 该国该年无真实记录时降级到深史估计（标注"估计"），绝不抛错中断游戏——精准是分层标注，不是拒之门外。
  const deepHistSnap = (): BirthSnapshot => {
    // 过渡年（如 1750-1950 某国无数据）钳到 1749——用最后一个深史锚点估计
    const y = Math.min(Math.max(input.birthYear, -2100), 1749);
    const est = deepHistoryEstimate(y, cultureOf(input.country));
    return {
      lex: est.lex,
      childMort: est.childMort,
      fertility: 5.5,
      schooling: 0.5,
      gdpPc: 500,
      present: { lex: false, childMort: false, fertility: false, schooling: false, gdpPc: false },
    };
  };
  let snap: BirthSnapshot;
  if (isDeepHistory(input.birthYear)) {
    snap = deepHistSnap();
  } else {
    try {
      snap = birthSnapshot(world, input.country, input.birthYear);
    } catch (e) {
      // 该国该年无真实记录 → 降级到深史估计——但只在年份合理时（1750-1950 过渡带）。
      // 未知国家在 1995 年仍应报「无真实寿命记录」（精准铁律：不编造数据）。
      if (input.birthYear <= 1950) {
        snap = deepHistSnap();
      } else {
        throw e;
      }
    }
  }
  // 性别差异暂不在校准层调整——OWID lex 是男女混合均值，直接使用可保证
  // 分布检验（对比混合均值）的精准度。性别差异通过事件系统体现（女性事件
  // 的健康/风险分布不同）。后续可引入分性别的 OWID 数据做精确调整。
  const genderLexAdj = snap.lex;
  const model = calibrateMortality(genderLexAdj, snap.childMort);
  const name = makeName(rng, input.country, input.gender);

  // ── 出生属性 ──────────────────────────────────────────────────────────────
  // 家庭财富分位：无基尼数据（契约 §1 无此字段）用固定分布近似——均值 50 ± 偏移，
  // 高生育率社会人均资源被摊薄，起点略降。数据不到位时宁可保守也不凭空编精度。
  const wealth0 = clamp(50 + (rng() - 0.5) * 70 - (snap.fertility - 2.5) * 3, 5, 95);
  const state: LifeState = {
    alive: true,
    health: Math.round(65 + rng() * 20),
    education: 0,
    wealth: Math.round(wealth0),
    happiness: Math.round(55 + rng() * 25),
  };

  // 亲人名懒生成：首次用到才抽（确定性保持——同种子首次调用的时点也相同）
  let partner: string | null = null;
  let child: string | null = null;
  const interp = (text: string): string => {
    if (partner === null && text.includes('{partner}')) partner = makeName(rng, input.country, rng() < 0.5 ? 'f' : 'm');
    if (child === null && text.includes('{child}')) child = makeName(rng, input.country, rng() < 0.5 ? 'f' : 'm');
    // replaceAll 需要 ES2021 lib，项目锚 ES2020——用全局正则等价实现
    return text.replace(/\{name\}/g, name).replace(/\{partner\}/g, partner ?? '').replace(/\{child\}/g, child ?? '');
  };

  const events: LifeEvent[] = [];
  let choicesMade = 0;
  const firedOnce = new Set<string>();
  const recent: string[] = [];
  // 同年去重 + 一生次数上限：两级放宽只放宽「近期重现」，这两条永远有效——
  // 玩家会记住「老先生借了三本书」，同年讲两遍、一生讲四遍都是叙事事故
  const firedCount = new Map<string, number>();
  const firedThisYear = new Set<string>();

  const applyEffects = (eff: Partial<LifeState>) => {
    if (eff.health !== undefined) state.health = Math.round(clamp(state.health + eff.health));
    if (eff.education !== undefined) state.education = Math.round(clamp(state.education + eff.education));
    if (eff.wealth !== undefined) state.wealth = Math.round(clamp(state.wealth + eff.wealth));
    if (eff.happiness !== undefined) state.happiness = Math.round(clamp(state.happiness + eff.happiness));
  };

  const fireEvent = (t: EventTemplate, year: number, age: number): void => {
    firedOnce.add(t.id);
    firedCount.set(t.id, (firedCount.get(t.id) ?? 0) + 1);
    firedThisYear.add(t.id);
    recent.push(t.id);
    if (recent.length > RECENT_WINDOW) recent.shift();
    const ctx: EventContext = { state: { ...state }, snapshot: snap, country: input.country, gender: input.gender, birthYear: input.birthYear, year, age };
    let text = interp(t.text);
    let effects: Partial<LifeState> | undefined = t.effects ? { ...t.effects } : undefined;
    if (t.choice) {
      // 纯函数引擎里没有玩家——命运（rng + 状态倾向）替角色选，choice 原样记录供 UI 重演
      const weights = t.choice.options.map((o) => Math.max(0.01, o.weight ? o.weight(ctx) : 1));
      const total = weights.reduce((a, b) => a + b, 0);
      let r = rng() * total;
      let picked = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { picked = i; break; }
      }
      const opt = t.choice.options[picked];
      applyEffects(opt.effects);
      effects = { ...opt.effects };
      text += ' ' + interp(opt.outcome);
      choicesMade++;
    }
    if (t.effects) applyEffects(t.effects);
    const ev: LifeEvent = {
      age,
      year,
      domain: t.domain,
      id: t.id,
      text,
      effects,
    };
    if (t.choice) ev.choice = { prompt: t.choice.prompt, options: t.choice.options.map((o) => ({ label: o.label, effects: { ...o.effects } })) };
    if (t.dataSource) ev.dataSource = t.dataSource;
    events.push(ev);
  };

  const eligible = (t: EventTemplate, age: number, year: number, useRecent: boolean): boolean => {
    if (age < t.minAge || age > t.maxAge) return false;
    // 时代分层（默认严格）：未标注 minYear 的事件视为「工业后叙事」——只在 1750 年后触发。
    // 时代专属池（eras.ts）自带精确 minYear/maxYear，覆盖青铜→近代早期（-2100~1750）。
    // 真正的普世事件（出生/学步/衰老）标 minYear: -2100 全域触发。
    const minYear = t.minYear ?? 1990; // 方案 A：默认事件只在 1990 后触发
    if (year < minYear) return false;
    if (t.maxYear !== undefined && year > t.maxYear) return false;
    if (t.once && firedOnce.has(t.id)) return false;
    if (firedThisYear.has(t.id)) return false;
    if ((firedCount.get(t.id) ?? 0) >= 2) return false;
    if (useRecent && recent.includes(t.id)) return false;
    const ctx: EventContext = { state: { ...state }, snapshot: snap, country: input.country, gender: input.gender, birthYear: input.birthYear, year, age };
    return t.cond ? t.cond(ctx) : true;
  };

  const drawEvent = (age: number, year: number): EventTemplate | null => {
    // 两级放宽：先带近期去重抽；池空则放开去重；再空才作罢（比如童年早期事件本来就少）。
    // era 域不进日常池——时代事件的触发权完全归主循环的 eraPool（年度锚点+一生一次），
    // 混进日常抽取会用 firedCount≤2 的宽限隔年重讲
    for (const useRecent of [true, false]) {
      const pool = ALL_EVENTS.filter((t) => t.domain !== 'era' && eligible(t, age, year, useRecent));
      if (pool.length === 0) continue;
      const weights = pool.map((t) => (t.choice ? 6 : 1) * (t.weight ?? 1)); // 抉择点高权重：命运路口不该总被日常淹没
      const total = weights.reduce((a, b) => a + b, 0);
      let r = rng() * total;
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) return pool[i];
      }
      return pool[pool.length - 1];
    }
    return null;
  };

  // ── 逐年主循环：先掷生死，再走人间事 ──────────────────────────────────────
  let deathAge = MAX_AGE + 0.5;
  let cause = '无疾而终';
  for (let age = 0; age <= MAX_AGE; age++) {
    const uDeath = rng();
    const h = model.hazard[age];
    if (uDeath < h) {
      deathAge = age + uDeath; // 年内死亡时刻：与校准表同式（期望 a + h/2），连续年龄
      cause = pickCause(rng, age, state.health);
      break;
    }

    const year = input.birthYear + age;
    firedThisYear.clear(); // 年度翻篇：同年前缀检查重新开始

    // 学龄教育积累：国家 schooling 水平决定增速；低受教育社会的女童增速打折
    //（OWID 性别入学差距的直接建模——出生地与性别从出生起就在分流命运）
    if (age >= 6 && age <= 18) {
      let gain = 3 * (0.4 + snap.schooling / 12);
      if (input.gender === 'f' && snap.schooling < 5) gain *= 0.75;
      state.education = clamp(state.education + gain);
    }

    // era 锚点优先：真实年代事件是叙事骨架，窗口窄，优先于随机日常。
    // 额外排除已触发过的：时代事件一生只讲一遍（eligible 的 firedCount≤2 上限
    // 会放行「隔年重讲」——同一瘟疫连讲两年是叙事事故）
    const eraPool = ALL_EVENTS.filter((t) => t.domain === 'era' && !firedOnce.has(t.id) && eligible(t, age, year, false));
    if (eraPool.length > 0 && rng() < ERA_CHANCE) {
      fireEvent(eraPool[Math.floor(rng() * eraPool.length)], year, age);
      continue; // era 占据当年主事件名额
    }

    // 主事件：抉择点「临期兜底」——窗口只剩 ≤2 年而尚未到来的命运路口，强制到场，
    // 保证活过窗口的人生 ≥3 个抉择点（契约硬指标）落在确定性路径上而非纯抽运
    const urgent = ALL_EVENTS.filter((t) => t.choice && t.once && t.maxAge - age <= 2 && eligible(t, age, year, false));
    if (urgent.length > 0) {
      fireEvent(urgent[0], year, age);
      continue;
    }

    if (rng() < P_MAIN) {
      const t = drawEvent(age, year);
      if (t) fireEvent(t, year, age);
    }
    if (rng() < P_SECOND) {
      const t = drawEvent(age, year);
      if (t) fireEvent(t, year, age);
    }
  }

  state.alive = false;
  const pct = snap.lex > 0 ? (deathAge / snap.lex) * 100 : 0;
  return {
    input,
    events,
    deathAge: Math.round(deathAge * 10) / 10, // 一位小数：终局报告可读性；分布检验用原始值可另行统计
    summary: {
      deathAge: Math.round(deathAge * 10) / 10,
      cause,
      vsLex: {
        born: input.birthYear,
        died: input.birthYear + Math.floor(deathAge),
        bornCountryLex: Math.round(snap.lex * 10) / 10,
        pct: Math.round(pct * 10) / 10,
      },
      stats: {
        eventsSeen: events.length,
        choicesMade,
        domainsTouched: [...new Set(events.map((e) => e.domain))],
      },
    },
  };
}

// UI 侧的生命状态聚合：四维刻度条与事件 effects 的展示逻辑全部经手此处。
// 为什么集中——effects 的语义（增量 or 绝对值）契约未定，stub 按增量实现，
// 若真引擎定为绝对值，只需改 applyEffects 一个函数（已向 lead 标注）。
import type { Domain, LifeState } from '../engine/types';

// 集成决策（M1）：真引擎初值在引擎内部按 rng 动态生成（health 65-85、wealth 5-95 等），
// 不经事件流外显。UI 四维条以本参考系原点为基准展示事件带来的「漂移」——
// 漂移形态与引擎一致，绝对刻度是世界观装饰（M2 可让引擎外显真初值）。
export const INITIAL_STATE: LifeState = { alive: true, health: 70, education: 0, wealth: 45, happiness: 60 };

export function applyEffects(s: LifeState, fx?: Partial<LifeState>): LifeState {
  if (!fx) return s;
  const n = { ...s };
  for (const k of Object.keys(fx) as (keyof LifeState)[]) {
    const v = fx[k];
    if (v === undefined) continue;
    if (k === 'alive') {
      if (typeof v === 'boolean') n.alive = v; // key 收窄后才能安全写入联合类型字段
      continue;
    }
    if (typeof v === 'number') n[k] = Math.max(0, Math.min(100, n[k] + v));
  }
  return n;
}

// ---- Domain 的 UI 元数据：中文标签 + 色 token（实色在 styles.css 变量里定义） ----
export const DOMAIN_META: Record<Domain, { label: string; colorVar: string }> = {
  childhood: { label: '童年', colorVar: 'var(--d-childhood)' },
  education: { label: '求学', colorVar: 'var(--d-education)' },
  career: { label: '营生', colorVar: 'var(--d-career)' },
  family: { label: '家事', colorVar: 'var(--d-family)' },
  health: { label: '身体', colorVar: 'var(--d-health)' },
  era: { label: '时代', colorVar: 'var(--d-era)' },
};

// 四维刻度条的维度定义（顺序即展示顺序）
export const BARS: { key: 'health' | 'education' | 'wealth' | 'happiness'; label: string; colorVar: string }[] = [
  { key: 'health', label: '健康', colorVar: 'var(--d-health)' },
  { key: 'education', label: '学识', colorVar: 'var(--d-education)' },
  { key: 'wealth', label: '家境', colorVar: 'var(--d-wealth)' },
  { key: 'happiness', label: '心境', colorVar: 'var(--d-family)' },
];

// 出生家境分档叙事：wealth 初值（经 age0 家庭事件落定）→ 白描句。
// 为什么放 UI 层——分档是叙事裁量，与引擎数值解耦，集成真引擎后照常工作。
export function familyTone(wealth: number): string {
  if (wealth < 20) return '一户几乎揭不开锅的人家';
  if (wealth < 35) return '一个勉强温饱的农家';
  if (wealth < 55) return '一处不好不坏的普通人家';
  if (wealth < 75) return '一户殷实之家';
  return '一个含着银匙出生的家庭';
}

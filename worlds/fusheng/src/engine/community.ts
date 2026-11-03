// 社区事件（议事厅热上线）：玩家投稿 → 试验场检验 → 颁布后动态并入事件池。
// 校验是游戏平衡的第一道闸：era 域不开放（时代事件必须有真实出处，铁律）、
// 数值影响限幅（-15..+15）、窗口至少 5 年——把「会破坏世界的设计」挡在进引擎之前。
import type { Domain } from './types';
import type { EventTemplate } from './events';

export interface CommunityEventDraft {
  domain: Exclude<Domain, 'era'>;
  minAge: number;
  maxAge: number;
  text: string;
  effects?: Partial<{ health: number; education: number; wealth: number; happiness: number }>;
  once?: boolean;
}

export const COMMUNITY_PREFIX = 'fs-community-';
const OPEN_DOMAINS: ReadonlyArray<Exclude<Domain, 'era'>> = ['childhood', 'education', 'career', 'family', 'health'];
const FX_KEYS = ['health', 'education', 'wealth', 'happiness'] as const;

export function validateDraft(raw: unknown): { ok: true; draft: CommunityEventDraft } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: '提案须为对象' };
  const d = raw as Record<string, unknown>;
  if (!OPEN_DOMAINS.includes(d.domain as Exclude<Domain, 'era'>)) {
    return { ok: false, error: '事件域须为：童年/求学/营生/家事/身体（时代事件须真实出处，不开放投稿）' };
  }
  const minAge = Number(d.minAge);
  const maxAge = Number(d.maxAge);
  if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 0 || maxAge > 120 || minAge > maxAge) {
    return { ok: false, error: '年龄段须为 0–120 的整数且起点不晚于终点' };
  }
  if (maxAge - minAge < 5) return { ok: false, error: '年龄窗口至少 5 年（窗口太窄的事件几乎不会被抽到）' };
  const text = String(d.text ?? '').trim();
  if (text.length < 4 || text.length > 80) return { ok: false, error: '文案须为 4–80 字' };
  const effects: Partial<Record<(typeof FX_KEYS)[number], number>> = {};
  const rawFx = (d.effects ?? {}) as Record<string, unknown>;
  for (const k of FX_KEYS) {
    const v = rawFx[k];
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (!Number.isInteger(n) || Math.abs(n) > 15) return { ok: false, error: `${k} 影响须为 -15..15 的整数` };
    if (n !== 0) effects[k] = n;
  }
  return {
    ok: true,
    draft: {
      domain: d.domain as Exclude<Domain, 'era'>,
      minAge,
      maxAge,
      text,
      effects: Object.keys(effects).length ? effects : undefined,
      once: d.once === false ? false : true, // 默认一生一次：社区叙事更不该刷屏
    },
  };
}

/** 投稿定稿：入卷格式（id 由 hub 赋序号保证唯一） */
export function normalizeDraft(draft: CommunityEventDraft, seq: number): EventTemplate {
  return {
    id: `${COMMUNITY_PREFIX}${seq}`,
    domain: draft.domain,
    minAge: draft.minAge,
    maxAge: draft.maxAge,
    text: draft.text,
    effects: draft.effects,
    once: draft.once ?? true,
    dataSource: '社区议事厅', // 事件流里可见出处：群众写的
  };
}

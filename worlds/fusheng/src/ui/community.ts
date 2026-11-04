// 议事厅客户端：公民身份（0 门槛匿名 UUID）+ 社区事件热池载入 + API。
// 为什么全部静默降级：议事厅是共创层，不可用时游戏本体照常可玩——
// 拉不到热池=没有社区事件，而不是白屏。
import { setExtraEvents, type EventTemplate } from '../engine/events';

const ID_KEY = 'fusheng.citizen';

export function citizenId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = 'ctz-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return 'ctz-ephemeral';
  }
}

function headers(): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Citizen-Id': citizenId() };
}

/** 启动时并入已颁布社区事件（hub 返回的已是入卷格式，直接进池） */
export async function initCommunity(): Promise<void> {
  if (__FS_STATIC__) return; // 静态版：无 hub，不请求（公告/议事厅不可用，基线照玩）
  try {
    const r = await fetch('/nt/community-events.json', { cache: 'no-cache' });
    if (!r.ok) return;
    const data = (await r.json()) as { events: EventTemplate[] };
    if (Array.isArray(data.events) && data.events.length) setExtraEvents(data.events);
  } catch {
    /* 离线/旧 hub：无社区事件，基线池照玩 */
  }
}

// ---- API 类型（与 hub/council.mjs 对齐） ----
export interface Wish {
  id: string;
  text: string;
  by: string;
  boosts: string[];
  created: number;
}
export interface VerifyReport {
  n: number;
  base: { lex: number; childRate: number; events: number };
  treatment: { lex: number; childRate: number; events: number };
  lexPct: number;
  fired: boolean;
  pass: boolean;
  ranAt: number;
}
export interface Proposal {
  id: string;
  by: string;
  wishId: string | null;
  draft: {
    domain: 'childhood' | 'education' | 'career' | 'family' | 'health';
    minAge: number;
    maxAge: number;
    text: string;
    effects?: Partial<Record<'health' | 'education' | 'wealth' | 'happiness', number>>;
    once?: boolean;
  };
  status: 'open' | 'verified' | 'live';
  boosts: string[];
  created: number;
  report?: VerifyReport;
}
export interface CouncilData {
  wishes: Wish[];
  proposals: Proposal[];
  liveEvents: { id: string; text: string; domain: string }[];
  stats: { wishes: number; proposals: number; live: number; boosts: number };
}

async function jsonOr<T>(r: Response, fallback: T): Promise<T> {
  try {
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

export async function fetchCouncil(): Promise<CouncilData | null> {
  if (__FS_STATIC__) return null;
  try {
    const r = await fetch('/api/council', { headers: headers() });
    if (!r.ok) return null;
    return await jsonOr<CouncilData | null>(r, null);
  } catch {
    return null;
  }
}

export async function postWish(text: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/council/wishes', { method: 'POST', headers: headers(), body: JSON.stringify({ text }) });
  if (r.ok) return { ok: true };
  const e = await jsonOr<{ error?: string }>(r, {});
  return { ok: false, error: e.error ?? '许愿失败' };
}

export async function boostWish(id: string): Promise<void> {
  try {
    await fetch(`/api/council/wishes/${id}/boost`, { method: 'POST', headers: headers() });
  } catch { /* 网络抖动静默 */ }
}

export async function postProposal(draft: unknown, wishId?: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/council/proposals', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ draft, wishId }),
  });
  if (r.ok) return { ok: true };
  const e = await jsonOr<{ error?: string }>(r, {});
  return { ok: false, error: e.error ?? '提案失败' };
}

export async function boostProposal(id: string): Promise<void> {
  try {
    await fetch(`/api/council/proposals/${id}/boost`, { method: 'POST', headers: headers() });
  } catch { /* 静默 */ }
}

export async function verifyProposal(id: string): Promise<{ ok: boolean; error?: string; report?: VerifyReport; status?: string }> {
  const r = await fetch(`/api/council/proposals/${id}/verify`, { method: 'POST', headers: headers() });
  return await jsonOr(r, { ok: false, error: '试验失败' });
}

export async function enactProposal(id: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`/api/council/proposals/${id}/enact`, {
    method: 'POST',
    headers: { ...headers(), 'X-Admin-Token': token },
  });
  if (r.ok) return { ok: true };
  const e = await jsonOr<{ error?: string }>(r, {});
  return { ok: false, error: e.error ?? '颁布失败' };
}

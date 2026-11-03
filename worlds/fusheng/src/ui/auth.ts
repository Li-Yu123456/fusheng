// 账号客户端（M3 SSO）：邮箱验证码登录 + 前世存档。静默降级——hub 不在或未登录
// 都不挡游戏，只是少一层记忆。
import { citizenId } from './community';

export interface Me {
  signed: boolean;
  name?: string;
  email?: string;
}
export interface PastLife {
  seed: number;
  country: string;
  birth_year: number;
  gender: string;
  death_age: number;
  events: number;
  ended_at: number;
}

function headers(): HeadersInit {
  return { 'Content-Type': 'application/json', 'X-Citizen-Id': citizenId() };
}

export async function fetchMe(): Promise<Me> {
  try {
    const r = await fetch('/api/auth/me', { headers: headers() });
    if (!r.ok) return { signed: false };
    return await r.json();
  } catch {
    return { signed: false };
  }
}

export async function requestCode(email: string): Promise<{ ok: boolean; error?: string; note?: string; code?: string }> {
  const r = await fetch('/api/auth/request', { method: 'POST', headers: headers(), body: JSON.stringify({ email }) });
  const d = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, note: d.devNote, code: d.devCode } : { ok: false, error: d.error ?? '发送失败' };
}

export async function verifyCode(email: string, code: string, name: string): Promise<{ ok: boolean; error?: string; name?: string }> {
  const r = await fetch('/api/auth/verify', { method: 'POST', headers: headers(), body: JSON.stringify({ email, code, name }) });
  const d = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, name: d.name } : { ok: false, error: d.error ?? '验证失败' };
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/signout', { method: 'POST', headers: headers() });
  } catch { /* 静默 */ }
}

export async function saveLife(input: { seed: number; country: string; birthYear: number; gender: 'm' | 'f' }, deathAge: number, events: number): Promise<void> {
  try {
    await fetch('/api/lives', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        seed: input.seed,
        country: input.country,
        birthYear: input.birthYear,
        gender: input.gender,
        deathAge,
        events,
      }),
    });
  } catch { /* 存档失败不挡终局情绪 */ }
}

export async function fetchPastLives(): Promise<PastLife[] | null> {
  try {
    const r = await fetch('/api/lives/me', { headers: headers() });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d.lives) ? d.lives : [];
  } catch {
    return null;
  }
}

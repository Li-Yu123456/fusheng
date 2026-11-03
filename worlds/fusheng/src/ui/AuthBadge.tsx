// 账号徽章（M3）：右上角「登录 / 名字」——点开是登录浮层或「前世 + 登出」。
// 0 强制：不登录照样玩，登录只多一份跨设备的「前世」记忆。
import { useCallback, useEffect, useState } from 'react';
import type { Me, PastLife } from './auth';
import { fetchMe, requestCode, verifyCode, signOut, fetchPastLives } from './auth';
// 本地模式：hub 对回环直连会随响应带回验证码（devCode）——直接亮在框里，
// 省得玩家去翻终端窗口（真上线走邮箱，此字段永远为空）

export default function AuthBadge() {
  const [me, setMe] = useState<Me>({ signed: false });
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'menu' | 'login' | 'past'>('menu');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [past, setPast] = useState<PastLife[] | null>(null);

  const refresh = useCallback(() => { fetchMe().then(setMe); }, []);
  useEffect(refresh, [refresh]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  const send = async () => {
    if (!email.trim()) return;
    setBusy(true);
    const r = await requestCode(email.trim());
    setBusy(false);
    if (r.ok && r.code) flash(`验证码：${r.code}（本地直连模式，已自动填入）`), setCode(r.code);
    else if (r.ok) flash('验证码已发到邮箱，查收后填入');
    else flash(r.error ?? '发送失败');
  };

  const verify = async () => {
    setBusy(true);
    const r = await verifyCode(email.trim(), code.trim(), name.trim());
    setBusy(false);
    if (r.ok) {
      refresh();
      setPanel('menu');
      flash(`欢迎，${r.name}`);
    } else flash(r.error ?? '验证失败');
  };

  return (
    <>
      <button
        type="button"
        className="auth-badge"
        onClick={() => { setOpen((v) => !v); setPanel('menu'); }}
        aria-label={me.signed ? `账号：${me.name}` : '登录'}
      >
        {me.signed ? me.name : '登录'}
      </button>
      {open && (
        <div className="auth-panel" role="dialog" aria-label="账号">
          {msg && <p className="auth-msg" role="alert">{msg}</p>}
          {panel === 'menu' && (me.signed ? (
            <>
              <p className="auth-hi">{me.name}，欢迎回来</p>
              <button type="button" className="ghost-btn" onClick={async () => { setPast(await fetchPastLives()); setPanel('past'); }}>我的前世</button>
              <button type="button" className="ghost-btn" onClick={async () => { await signOut(); refresh(); flash('已登出'); }}>登出</button>
            </>
          ) : (
            <>
              <p className="auth-hi">一个邮箱，所有前世通用。不用密码。</p>
              <button type="button" className="ghost-btn" onClick={() => setPanel('login')}>邮箱验证码登录</button>
              <button type="button" className="ghost-btn" onClick={async () => { setPast(await fetchPastLives()); setPanel('past'); }}>我的前世（本机）</button>
            </>
          ))}
          {panel === 'menu' && <p className="auth-note">不登录也能玩——前世只记在这台设备上。</p>}
          {panel === 'login' && (
            <div className="auth-form">
              <input className="auth-input" type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="邮箱" />
              <div className="auth-row">
                <input className="auth-input" inputMode="numeric" placeholder="验证码" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="验证码" />
                <button type="button" className="ghost-btn" onClick={send} disabled={busy || !email.trim()}>发码</button>
              </div>
              <input className="auth-input" placeholder="新邮箱起个名字（老邮箱可空）" value={name} onChange={(e) => setName(e.target.value.slice(0, 16))} aria-label="用户名" />
              <button type="button" className="primary-btn small" onClick={verify} disabled={busy || code.length < 6}>登录</button>
              <p className="auth-note">{msg || '本地模式验证码在 hub 控制台；上线后走邮箱。'}</p>
            </div>
          )}
          {panel === 'past' && (
            <div className="auth-past">
              {past === null && <p className="auth-note">前世档案连接中……</p>}
              {past && past.length === 0 && <p className="auth-note">还没有前世——第一世由你写下。</p>}
              {past && past.map((l, i) => (
                <button type="button" key={i} className="past-row" onClick={() => { window.location.href = `/worlds/fusheng/?seed=${l.seed}&c=${l.country}&y=${l.birth_year}&g=${l.gender}`; }}>
                  <span className="past-age">{Math.floor(l.death_age)} 岁</span>
                  <span className="past-meta">{l.country} · {l.birth_year} 年生 · {l.events} 件事</span>
                  <span className="past-go">再赴此生 ↦</span>
                </button>
              ))}
              <button type="button" className="ghost-btn" onClick={() => setPanel('menu')}>← 返回</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

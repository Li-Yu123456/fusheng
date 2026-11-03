// 议事厅：浮生的立法现场。许愿 → 顶票 → 提案 → 试验场（引擎真跑对照）→ 颁布。
// 每一票真实计数、每份报告真实模拟、每次颁布真实改变所有人的世界。
// 设计分寸：这是「游戏的另一半」——玩人生的人多一条参与设计世界的路，
// 但绝不强迫：不注册、不留资、关掉就走。
import { useCallback, useEffect, useState } from 'react';
import type { CouncilData, Proposal, VerifyReport, Wish } from './community';
import { fetchCouncil, postWish, boostWish, postProposal, boostProposal, verifyProposal, enactProposal } from './community';

const DOMAIN_ZH: Record<string, string> = {
  childhood: '童年',
  education: '求学',
  career: '营生',
  family: '家事',
  health: '身体',
};
const STATUS_META: Record<Proposal['status'], { label: string; cls: string }> = {
  open: { label: '待验', cls: 'open' },
  verified: { label: '已过验', cls: 'verified' },
  live: { label: '已上线', cls: 'live' },
};

type Tab = 'wishes' | 'proposals';

export default function CouncilHall({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<CouncilData | null>(null);
  const [tab, setTab] = useState<Tab>('wishes');
  const [wishText, setWishText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adminToken, setAdminToken] = useState('');

  const refresh = useCallback(async () => {
    setData(await fetchCouncil());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000); // 轮询够用：议事厅不是实时战场
    return () => clearInterval(t);
  }, [refresh]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3200);
  };

  const submitWish = async () => {
    if (!wishText.trim()) return;
    setBusy(true);
    const r = await postWish(wishText.trim());
    setBusy(false);
    if (r.ok) {
      setWishText('');
      flash('愿望已入池。');
    } else flash(r.error ?? '许愿失败');
    refresh();
  };

  const doBoostWish = async (id: string) => {
    await boostWish(id);
    refresh();
  };

  const doVerify = async (id: string) => {
    setBusy(true);
    flash('试验场开跑：2100 次人生对照……');
    const r = await verifyProposal(id);
    setBusy(false);
    if (r.ok && r.report) flash(r.report.pass ? `检验通过：寿命偏移 ${r.report.lexPct}%（阈 ±2%）` : `未通过：寿命偏移 ${r.report.lexPct}%`);
    else flash(r.error ?? '试验失败');
    refresh();
  };

  const doEnact = async (id: string) => {
    if (!adminToken.trim()) {
      flash('先在「集中端」栏填入颁布令牌（hub 控制台可取）');
      return;
    }
    setBusy(true);
    const r = await enactProposal(id, adminToken.trim());
    setBusy(false);
    flash(r.ok ? '已颁布——从下一段人生起，全世界都会遇见这件事。' : r.error ?? '颁布失败');
    refresh();
  };

  return (
    <div className="screen council">
      <header className="council-head">
        <div>
          <h2 className="council-title">议事厅</h2>
          <p className="council-sub">浮生的立法现场——玩的人，就是造世界的人</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onBack}>← 回到投胎</button>
      </header>

      {data ? (
        <div className="council-board" role="status">
          <span>愿望 {data.stats.wishes}</span>
          <span>提案 {data.stats.proposals}</span>
          <span>已上线 {data.stats.live}</span>
          <span>累计顶票 {data.stats.boosts}</span>
        </div>
      ) : (
        <p className="council-loading">议事厅连接中……（hub 未启动时此处为空，游戏本体不受影响）</p>
      )}

      {msg && <p className="council-msg" role="alert">{msg}</p>}

      <nav className="council-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'wishes'} className={`council-tab${tab === 'wishes' ? ' sel' : ''}`} onClick={() => setTab('wishes')}>
          许愿池
        </button>
        <button type="button" role="tab" aria-selected={tab === 'proposals'} className={`council-tab${tab === 'proposals' ? ' sel' : ''}`} onClick={() => setTab('proposals')}>
          提案与试验
        </button>
      </nav>

      {tab === 'wishes' && (
        <section className="council-sec">
          <div className="wish-form">
            <input
              className="wish-input"
              value={wishText}
              maxLength={140}
              placeholder="你想在浮生里遇见什么？（2–140 字）"
              onChange={(e) => setWishText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitWish()}
            />
            <button type="button" className="primary-btn small" onClick={submitWish} disabled={busy || !wishText.trim()}>
              许愿
            </button>
          </div>
          <ul className="wish-list">
            {(data?.wishes ?? []).map((w) => (
              <WishRow key={w.id} wish={w} onBoost={() => doBoostWish(w.id)} />
            ))}
            {data && data.wishes.length === 0 && <li className="council-empty">还没有愿望——第一条由你写下。</li>}
          </ul>
        </section>
      )}

      {tab === 'proposals' && (
        <section className="council-sec">
          <ProposeForm onSubmit={async (draft) => {
            setBusy(true);
            const r = await postProposal(draft);
            setBusy(false);
            flash(r.ok ? '提案已入堂，请同伴顶起后开试验。' : r.error ?? '提案失败');
            refresh();
          }} busy={busy} />

          <div className="admin-row">
            <input
              className="admin-input"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="集中端颁布令牌（hub 控制台）"
            />
          </div>

          <ul className="prop-list">
            {(data?.proposals ?? []).map((p) => (
              <ProposalRow key={p.id} p={p} onBoost={() => boostProposal(p.id).then(refresh)} onVerify={() => doVerify(p.id)} onEnact={() => doEnact(p.id)} />
            ))}
            {data && data.proposals.length === 0 && <li className="council-empty">提案堂还空着——从许愿池挑一条，把它写成事件。</li>}
          </ul>
        </section>
      )}
    </div>
  );
}

function WishRow({ wish, onBoost }: { wish: Wish; onBoost: () => void }) {
  const mine = wish.boosts.length;
  return (
    <li className="wish-row">
      <span className="wish-text">{wish.text}</span>
      <button type="button" className={`boost-btn${mine > 0 ? ' has' : ''}`} onClick={onBoost} aria-label={`顶这条愿望（现 ${mine} 顶）`}>
        ▲ {mine}
      </button>
    </li>
  );
}

function ProposalRow({ p, onBoost, onVerify, onEnact }: { p: Proposal; onBoost: () => void; onVerify: () => void; onEnact: () => void }) {
  const st = STATUS_META[p.status];
  const r = p.report;
  return (
    <li className={`prop-card ${st.cls}`}>
      <div className="prop-top">
        <span className="prop-status" data-status={p.status}>{st.label}</span>
        <span className="prop-domain">{DOMAIN_ZH[p.draft.domain] ?? p.draft.domain} · {p.draft.minAge}–{p.draft.maxAge} 岁</span>
        <button type="button" className={`boost-btn${p.boosts.length > 0 ? ' has' : ''}`} onClick={onBoost} aria-label={`顶这份提案（现 ${p.boosts.length} 顶）`}>
          ▲ {p.boosts.length}
        </button>
      </div>
      <p className="prop-text">{p.draft.text}</p>
      {p.draft.effects && (
        <p className="prop-fx">
          {Object.entries(p.draft.effects).map(([k, v]) => `${DOMAIN_FX_ZH[k] ?? k} ${v > 0 ? '+' : ''}${v}`).join(' · ')}
        </p>
      )}
      {r && <ReportView r={r} />}
      <div className="prop-actions">
        {p.status === 'open' && (
          <button type="button" className="ghost-btn" onClick={onVerify}>开试验（2100 次对照）</button>
        )}
        {p.status === 'verified' && (
          <button type="button" className="primary-btn small" onClick={onEnact}>颁布上线</button>
        )}
        {p.status === 'live' && <span className="prop-live-note">全世界的人生里，已经有人遇见它。</span>}
      </div>
    </li>
  );
}

const DOMAIN_FX_ZH: Record<string, string> = { health: '健康', education: '学识', wealth: '家境', happiness: '心境' };

function ReportView({ r }: { r: VerifyReport }) {
  return (
    <div className="prop-report">
      <p className={r.pass ? 'report-pass' : 'report-fail'}>
        {r.pass ? '✓ 检验通过' : '✗ 未通过'}：寿命均值 {r.base.lex} → {r.treatment.lex} 岁（Δ {r.lexPct > 0 ? '+' : ''}{r.lexPct}%，阈 ±2%）
        · 人均事件 {r.base.events} → {r.treatment.events}{r.fired ? '' : '（事件未被抽到：窗口或条件无效）'}
      </p>
      <p className="report-note">n = {r.n} 次模拟（CHN/JPN/NGA × 1990，同种子配对对照）——报告由与游戏同一份引擎跑出</p>
    </div>
  );
}

function ProposeForm({ onSubmit, busy }: { onSubmit: (draft: unknown) => void; busy: boolean }) {
  const [domain, setDomain] = useState<Proposal['draft']['domain']>('childhood');
  const [minAge, setMinAge] = useState(6);
  const [maxAge, setMaxAge] = useState(16);
  const [text, setText] = useState('');
  const [fx, setFx] = useState<Record<string, number>>({});

  const setF = (k: string, v: string) => {
    const n = Math.max(-15, Math.min(15, Number(v) || 0));
    setFx((f) => ({ ...f, [k]: n }));
  };

  const submit = () => {
    if (text.trim().length < 4) return;
    const effects: Record<string, number> = {};
    for (const [k, v] of Object.entries(fx)) if (v !== 0) effects[k] = v;
    onSubmit({ domain, minAge, maxAge, text: text.trim(), effects: Object.keys(effects).length ? effects : undefined });
    setText('');
    setFx({});
  };

  return (
    <div className="prop-form">
      <p className="prop-form-title">把你希望发生的事写成一条事件——写得好的，全世界都会遇见。</p>
      <div className="prop-form-row">
        <select className="prop-select" value={domain} onChange={(e) => setDomain(e.target.value as Proposal['draft']['domain'])} aria-label="事件域">
          {Object.entries(DOMAIN_ZH).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="prop-age">
          <input type="number" min={0} max={120} value={minAge} onChange={(e) => setMinAge(Number(e.target.value) || 0)} aria-label="起始年龄" /> –
          <input type="number" min={0} max={120} value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value) || 0)} aria-label="结束年龄" /> 岁
        </label>
      </div>
      <textarea
        className="prop-textarea"
        value={text}
        maxLength={80}
        rows={2}
        placeholder="事件文案（4–80 字，写「你」的事，如：你在阁楼发现一箱旧书，读了一整个夏天。）"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="prop-fx-row">
        {Object.entries(DOMAIN_FX_ZH).map(([k, v]) => (
          <label key={k} className="prop-fx-item">
            {v}
            <input type="number" min={-15} max={15} value={fx[k] ?? ''} placeholder="0" onChange={(e) => setF(k, e.target.value)} aria-label={`${v}影响`} />
          </label>
        ))}
      </div>
      <button type="button" className="primary-btn small" onClick={submit} disabled={busy || text.trim().length < 4 || minAge > maxAge}>
        提案入堂
      </button>
    </div>
  );
}

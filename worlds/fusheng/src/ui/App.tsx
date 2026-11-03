// App：页面流相位机 —— setup(投胎设定) → drawing(命运抽签) → birth(出生文书) → life(人生时间轴) → end(终局)
// 为什么把相位放顶层——URL ?seed= 玩法要求「一份 input 贯穿全场」，终局还能复制回放。
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LifeInput, LifeResult } from './engine';
import { simulate } from './engine';
import { makeRng } from '../engine/rng';
import { listCountries, type CountryMeta } from './worldAdapter';
import SetupScreen, { type SetupDraft } from './SetupScreen';
import DrawingOverlay from './DrawingOverlay';
import BirthReport from './BirthReport';
import LifeTimeline from './LifeTimeline';
import CouncilHall from './CouncilHall';
import AuthBadge from './AuthBadge';
import { saveLife } from './auth';
import EndReport from './EndReport';
import { clampYear } from './yearRange';

type Phase = 'setup' | 'drawing' | 'birth' | 'life' | 'end' | 'council';
type ThemeMode = 'auto' | 'light' | 'dark';

// URL → 设定草稿（?seed=42&c=CHN&y=1978&g=f，非法值静默丢弃）
function readUrlDraft(): SetupDraft {
  const q = new URLSearchParams(window.location.search);
  const seed = q.get('seed');
  const c = q.get('c');
  const y = q.get('y');
  const g = q.get('g');
  return {
    seed: seed && /^\d{1,9}$/.test(seed) ? seed : '',
    country: c && /^[A-Z]{3}$/.test(c) ? c : null,
    birthYear: y && /^\d{4}$/.test(y) ? clampYear(Number(y)) : null,
    gender: g === 'm' || g === 'f' ? g : null,
  };
}

// input → 可分享 URL（全参数固化，「两次进入同一人生」的复现键）
function shareUrl(input: LifeInput): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?seed=${input.seed}&c=${input.country}&y=${input.birthYear}&g=${input.gender}`;
}

export default function App() {
  const countries = useMemo<CountryMeta[]>(() => listCountries(), []);
  const [phase, setPhase] = useState<Phase>('setup');
  const [draft, setDraft] = useState<SetupDraft>(() => readUrlDraft());
  const [input, setInput] = useState<LifeInput | null>(null);
  const [result, setResult] = useState<LifeResult | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  // 主题：默认跟随系统（data-theme 缺省走 media query），手动切换则钉死
  useEffect(() => {
    const el = document.documentElement;
    if (themeMode === 'auto') delete el.dataset.theme;
    else el.dataset.theme = themeMode;
  }, [themeMode]);

  const handleSubmit = useCallback(
    (d: SetupDraft) => {
      // 空项在提交时一次性掷骰补全——补全后的完整 input 才进入 simulate 与分享链接。
      // seed 来自 URL 时，命运三掷（国/年/性别）也走 makeRng(seed) 派生流：
      // ?seed=42 两次进入是同一段人生（验收 6）；无 seed 的「交给命运」才真正随机。
      const seed = d.seed ? Number(d.seed) : 1 + Math.floor(Math.random() * 999999999);
      const fate = d.seed ? makeRng(seed) : Math.random;
      const country = d.country && countries.some((c) => c.code === d.country) ? d.country : countries[Math.floor(fate() * countries.length)].code;
      const birthYear = d.birthYear ?? clampYear(1950 + Math.floor(fate() * 56));
      const gender: 'm' | 'f' = d.gender ?? (fate() < 0.5 ? 'm' : 'f');
      const li: LifeInput = { seed, country, birthYear, gender };
      setInput(li);
      setResult(simulate(li)); // 纯函数、同步、毫秒级——在抽签转场前就备好
      setPhase('drawing');
    },
    [countries],
  );

  const handleRestart = useCallback(() => {
    // 再来一世：参数全部交还给命运，URL 参数同步清空（避免刷新回放上一世）
    window.history.replaceState(null, '', window.location.pathname);
    setDraft({ seed: '', country: null, birthYear: null, gender: null });
    setInput(null);
    setResult(null);
    setPhase('setup');
  }, []);

  if (phase === 'setup') {
    return (
      <Shell mode={themeMode} onMode={setThemeMode}>
        {/* 议事厅入口：立法现场对每个玩家敞开——0 门槛，关掉就走 */}
        <button type="button" className="council-entry" onClick={() => setPhase('council')}>
          议事厅
        </button>
        <SetupScreen initial={draft} countries={countries} onSubmit={handleSubmit} />
      </Shell>
    );
  }
  if (phase === 'council') {
    return <Shell mode={themeMode} onMode={setThemeMode}><CouncilHall onBack={() => setPhase('setup')} /></Shell>;
  }
  if (phase === 'drawing' && input) {
    return <Shell mode={themeMode} onMode={setThemeMode}><DrawingOverlay input={input} onComplete={() => setPhase('birth')} /></Shell>;
  }
  if (phase === 'birth' && result) {
    return <Shell mode={themeMode} onMode={setThemeMode}><BirthReport result={result} onBegin={() => setPhase('life')} /></Shell>;
  }
  if (phase === 'life' && result) {
    return <Shell mode={themeMode} onMode={setThemeMode}><LifeTimeline result={result} onFinish={() => { void saveLife(result.input, result.summary.deathAge, result.summary.stats.eventsSeen); setPhase('end'); }} /></Shell>;
  }
  if (phase === 'end' && result) {
    return <Shell mode={themeMode} onMode={setThemeMode}><EndReport result={result} shareLink={shareUrl(result.input)} onRestart={handleRestart} /></Shell>;
  }
  // 相位与数据不一致的兜底（理论上不可达）：回到设定页而非白屏
  return <Shell mode={themeMode} onMode={setThemeMode}><SetupScreen initial={draft} countries={countries} onSubmit={handleSubmit} /></Shell>;
}

// 外壳：主题切换按钮（三态循环）+ 页面容器
function Shell({ mode, onMode, children }: { mode: ThemeMode; onMode: (m: ThemeMode) => void; children: ReactNode }) {
  const next = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
  const label = mode === 'auto' ? '主题：随系统' : mode === 'light' ? '主题：浅' : '主题：深';
  return (
    <div className="shell">
      <button type="button" className="theme-toggle" onClick={() => onMode(next)} aria-label={`${label}（点击切换）`} title={label}>
        <ThemeIcon mode={mode} />
      </button>
      <AuthBadge />
      {children}
    </div>
  );
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  // 三个 12px 线框 SVG：半填充=auto，日轮=light，月牙=dark（不用 emoji，保持墨水感）
  if (mode === 'auto')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" fill="currentColor" />
      </svg>
    );
  if (mode === 'light')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="7" y1="1" x2="7" y2="2.8" stroke="currentColor" strokeWidth="1.2" transform={`rotate(${a} 7 7)`} />
        ))}
      </svg>
    );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M8.5 1.5 A5.5 5.5 0 1 0 12.5 8.5 A4.5 4.5 0 0 1 8.5 1.5 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

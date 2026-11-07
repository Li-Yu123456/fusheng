// 抽象宇宙 2.0 · 至高无上——UI 本身就是抽象的
import { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LifeMode from './modes/life/LifeMode';
import DictMode from './modes/dict/DictMode';
import FortuneMode from './modes/news/FortuneMode';
import TarotMode from './modes/tarot/TarotMode';
import type { Mode } from './shared/types';
import './shared/style.css';

const MODES: { id: Mode; label: string; icon: string; name: string; desc: string }[] = [
  { id: 'life', label: '人生', icon: '🎭', name: '抽象人生', desc: '投胎成一只薛定谔的猫然后被优化' },
  { id: 'dict', label: '词典', icon: '📖', name: '抽象词典', desc: 'yyds→绝绝子→尊嘟假嘟→你老了' },
  { id: 'tarot', label: '塔罗', icon: '🔮', name: '抽象塔罗', desc: '996福报·Leader的饼·已读不回' },
  { id: 'news', label: '抽签', icon: '🥢', name: '每日一签', desc: '命运已定，摇一百次也一样' },
];

// ── 漂浮装饰 ──
function FloatingChaos() {
  const items = ['😅', '🤡', '💀', '✨', '🌀', '🫠', '🤪', '💭'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {items.map((e, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${(i * 13 + 5) % 90}%`,
            top: `${(i * 17 + 10) % 80}%`,
            fontSize: `${16 + (i % 3) * 8}px`,
            opacity: 0.06,
            transform: `rotate(${(i * 37) % 360}deg)`,
            animation: `float ${6 + i}s ease-in-out infinite alternate`,
          }}
        >
          {e}
        </span>
      ))}
      <style>{`@keyframes float { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(-30px) rotate(20deg); } }`}</style>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>('home');
  const go = useCallback((m: Mode) => setMode(m), []);

  useEffect(() => {
    document.title = mode === 'home' ? '抽象宇宙 · 至高无上' : `抽象宇宙 · ${MODES.find((m) => m.id === mode)?.name ?? ''}`;
  }, [mode]);

  return (
    <div className="app-shell">
      <FloatingChaos />

      {mode === 'home' && (
        <div className="hero">
          <h1 className="hero-title">抽象宇宙</h1>
          <p className="hero-sub">ABSTRACT SUPREMACY</p>
          <div className="mode-grid">
            {MODES.map((m) => (
              <div key={m.id} className="mode-card glitch-hover" onClick={() => go(m.id)}>
                <div className="mode-icon">{m.icon}</div>
                <div>
                  <div className="mode-name">{m.name}</div>
                  <div className="mode-desc">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 28, fontSize: 11, color: 'rgba(234,255,234,.2)', fontStyle: 'italic', transform: 'rotate(-2deg)' }}>
            本站不提供任何有用信息 · 请勿当真 · 当真你就输了
          </p>
        </div>
      )}
      {mode === 'life' && <LifeMode />}
      {mode === 'dict' && <DictMode />}
      {mode === 'tarot' && <TarotMode />}
      {mode === 'news' && <FortuneMode />}

      <nav className="nav">
        <button className={`nav-btn ${mode === 'home' ? 'active' : ''}`} onClick={() => go('home')}>
          ✦宇宙
        </button>
        {MODES.map((m) => (
          <button key={m.id} className={`nav-btn ${mode === m.id ? 'active' : ''}`} onClick={() => go(m.id)}>
            {m.icon}{m.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

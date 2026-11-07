// 抽象宇宙·入口——四大抽象，一网打尽
import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import LifeMode from './modes/life/LifeMode';
import DictMode from './modes/dict/DictMode';
import NewsMode from './modes/news/NewsMode';
import TarotMode from './modes/tarot/TarotMode';
import type { Mode } from './shared/types';
import './shared/style.css';

const MODES: { id: Mode; label: string; icon: string; name: string; desc: string }[] = [
  { id: 'life', label: '人生', icon: '🎭', name: '抽象人生', desc: '投胎成一只薛定谔的猫' },
  { id: 'dict', label: '词典', icon: '📖', name: '抽象词典', desc: 'yyds→绝绝子→尊嘟假嘟' },
  { id: 'news', label: '新闻', icon: '📰', name: '抽象新闻', desc: '完全不存在但格式很正经' },
  { id: 'tarot', label: '塔罗', icon: '🔮', name: '抽象塔罗', desc: '算命但全是梗' },
];

function App() {
  const [mode, setMode] = useState<Mode>('home');

  const go = useCallback((m: Mode) => setMode(m), []);

  return (
    <div className="app-shell">
      {mode === 'home' && (
        <div className="hero">
          <h1 className="hero-title glitch">抽象宇宙</h1>
          <p className="hero-sub">ABSTRACT UNIVERSE · 全力搞抽象</p>
          <div className="mode-grid">
            {MODES.map((m) => (
              <div key={m.id} className="mode-card" onClick={() => go(m.id)}>
                <div className="mode-icon">{m.icon}</div>
                <div className="mode-name">{m.name}</div>
                <div className="mode-desc">{m.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            抽象值越高，离现实越远。请注意安全。
          </p>
        </div>
      )}
      {mode === 'life' && <LifeMode />}
      {mode === 'dict' && <DictMode />}
      {mode === 'news' && <NewsMode />}
      {mode === 'tarot' && <TarotMode />}

      <nav className="nav">
        <button className={`nav-btn ${mode === 'home' ? 'active' : ''}`} onClick={() => go('home')}>
          <span className="nav-icon">🌌</span>宇宙
        </button>
        {MODES.map((m) => (
          <button key={m.id} className={`nav-btn ${mode === m.id ? 'active' : ''}`} onClick={() => go(m.id)}>
            <span className="nav-icon">{m.icon}</span>{m.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

// 抽象塔罗——算命但全是梗
import { useState, useCallback, useMemo } from 'react';
import { TAROT } from '../../shared/data';
import type { TarotCard } from '../../shared/types';

interface DrawnCard {
  card: TarotCard;
  position: 'past' | 'present' | 'future';
  isReversed: boolean;
}

const POSITION_LABEL: Record<string, string> = {
  past: '昨天', present: '今天', future: '明天',
};

export default function TarotMode() {
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(false);

  const drawCards = useCallback(() => {
    const deck = [...TAROT];
    // 洗牌
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const cards: DrawnCard[] = [
      { card: deck[0], position: 'past', isReversed: Math.random() > 0.5 },
      { card: deck[1], position: 'present', isReversed: Math.random() > 0.5 },
      { card: deck[2], position: 'future', isReversed: Math.random() > 0.5 },
    ];
    setDrawn(cards);
    setRevealed(false);
  }, []);

  const revealAll = useCallback(() => setRevealed(true), []);

  const overallReading = useMemo(() => {
    if (drawn.length < 3 || !revealed) return '';
    const [past, present, future] = drawn;
    const parts = [
      `你的昨天被「${past.card.name}」${past.isReversed ? '（逆位）' : '（正位）'}笼罩着。`,
      `今天你正被「${present.card.name}」${present.isReversed ? '（逆位）' : '（正位）'}影响着。`,
      `而明天……「${future.card.name}」${future.isReversed ? '（逆位）' : '（正位）'}正在等着你。`,
    ];
    return parts.join('\n');
  }, [drawn, revealed]);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
          抽三张牌，看你的昨天、今天和明天。<br />
          所有解读纯属抽象——如果不准，说明你不够抽象。
        </p>
      </div>

      {drawn.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <button className="btn btn-blue pulse" onClick={drawCards}>
            🔮 开始抽牌
          </button>
        </div>
      ) : (
        <>
          <div className="tarot-deck">
            {drawn.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  className={`tarot-card ${revealed ? 'revealed' : ''}`}
                  style={{ transform: revealed && d.isReversed ? 'rotate(180deg)' : 'none' }}
                >
                  <div className="card-emoji">{d.card.emoji}</div>
                  <div className="card-name">{d.card.name}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                  {POSITION_LABEL[d.position]}
                </div>
              </div>
            ))}
          </div>

          {!revealed ? (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="btn" onClick={revealAll}>翻开牌面</button>
            </div>
          ) : (
            <>
              {drawn.map((d, i) => (
                <div key={i} className="tarot-reading fade-up">
                  <div className="reading-title">
                    {POSITION_LABEL[d.position]} · {d.card.emoji} {d.card.name} {d.isReversed ? '逆位' : '正位'}
                  </div>
                  <div className="reading-text">
                    {d.isReversed ? d.card.reversed : d.card.upright}
                  </div>
                </div>
              ))}
              <div className="tarot-reading" style={{ border: '1px solid var(--neon-pink)', marginTop: 16 }}>
                <div className="reading-title" style={{ color: 'var(--neon-pink)' }}>🔮 综合解读</div>
                <div className="reading-text" style={{ whiteSpace: 'pre-line' }}>{overallReading}</div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button className="btn btn-outline" onClick={drawCards}>再抽一次</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

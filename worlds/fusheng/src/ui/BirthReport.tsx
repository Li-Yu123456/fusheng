// 出生报告卡：户籍文书的形式承载「你出生在怎样的世界」。
// 财富分位叙事 + 该国该年 lex 与世界均值对比（数据缺失时逐级降级，不硬编）。
import { useEffect, useMemo } from 'react';
import type { LifeResult } from './engine';
import { getYearRow, getWorldLex, countryName } from './worldAdapter';
import { INITIAL_STATE, applyEffects, familyTone } from './simState';

export default function BirthReport({ result, onBegin }: { result: LifeResult; onBegin: () => void }) {
  const { input, events } = result;

  // 家境：age0 家庭事件落定后的 wealth 分档（无 age0 事件时用初值兜底）
  const wealth = useMemo(() => {
    const first = events.find((e) => e.age === 0);
    return applyEffects(INITIAL_STATE, first?.effects).wealth;
  }, [events]);

  const row = getYearRow(input.country, input.birthYear);
  const worldLex = getWorldLex(input.birthYear);

  // 时代背景句：叙事化该国 vs 世界；任一缺失则降级
  const eraLine = useMemo(() => {
    if (!row?.lex) return `这一年，世界人均可活 ${worldLex ?? '—'} 岁。`;
    if (!worldLex) return `这一年，你的国家人均可活 ${Math.round(row.lex)} 岁。`;
    const diff = Math.round(worldLex - row.lex);
    if (diff >= 2) return `这一年，你的国家人均可活 ${Math.round(row.lex)} 岁，世界是 ${Math.round(worldLex)} 岁——差着 ${diff} 年光阴。`;
    if (diff <= -2) return `这一年，你的国家人均可活 ${Math.round(row.lex)} 岁，比世界均值还多 ${-diff} 年。`;
    return `这一年，你的国家人均可活 ${Math.round(row.lex)} 岁，与世界相仿。`;
  }, [row, worldLex]);

  // 婴儿死亡阴影：childMort 高时补一句白描（约每 n 个新生儿有一人走不过五岁）
  const mortLine = useMemo(() => {
    const cm = row?.childMort;
    if (!cm || cm < 40) return null;
    const n = Math.max(2, Math.round(1000 / cm));
    return n <= 8 ? `这里，约每 ${n} 个新生儿，就有一个走不过五岁。` : null;
  }, [row]);

  // Enter = 翻开此生（全键盘可玩的一环）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onBegin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBegin]);

  return (
    <div className="screen birth">
      <article className="doc-card" aria-label="出生文书">
        <header className="doc-head">
          <span className="doc-title">出生文书</span>
          <span className="doc-seal" aria-hidden="true">
            浮生<br />为记
          </span>
        </header>

        <p className="doc-line big">
          {input.birthYear} 年 · {countryName(input.country)} · {input.gender === 'f' ? '女' : '男'}
        </p>
        <p className="doc-line">你生于{familyTone(wealth)}。</p>
        <p className="doc-line dim">{eraLine}</p>
        {mortLine && <p className="doc-line dim">{mortLine}</p>}

        <footer className="doc-foot">
          <button type="button" className="primary-btn" onClick={onBegin} autoFocus>
            翻开此生
          </button>
          <span className="key-hint">回车亦可</span>
        </footer>
      </article>
    </div>
  );
}

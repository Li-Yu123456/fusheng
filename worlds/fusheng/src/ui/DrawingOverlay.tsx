// 命运抽签转场：三行命签（何处/何年/何身）滚筒减速、依次定格。
// 为什么克制不用 3D 转盘——纸感命运簿的美学里，「渐停」比「旋转」更接近掷签。
// reduced-motion：直接呈现终态（契约 §4 全动画降级）。
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LifeInput } from './engine';
import { countryName, listCountries } from './worldAdapter';
import { usePrefersReducedMotion } from './useReducedMotion';
import { YEAR_MIN, YEAR_MAX } from './yearRange';

interface RowDef {
  key: string;
  label: string;
  final: string;
  pool: string[];
}

export default function DrawingOverlay({ input, onComplete }: { input: LifeInput; onComplete: () => void }) {
  const reduced = usePrefersReducedMotion();
  const rows = useMemo<RowDef[]>(() => {
    const names = listCountries().map((c) => c.zh);
    const years: string[] = [];
    for (let i = 0; i < 10; i++) years.push(String(YEAR_MIN + Math.floor(Math.random() * (YEAR_MAX - YEAR_MIN + 1))));
    return [
      { key: 'where', label: '何处', final: countryName(input.country), pool: names },
      { key: 'when', label: '何年', final: String(input.birthYear), pool: years },
      { key: 'who', label: '何身', final: input.gender === 'f' ? '女' : '男', pool: ['男', '女'] },
    ];
  }, [input]);
  const [doneCount, setDoneCount] = useState(0);

  // 装饰性滚筒用 Math.random（转场即逝）；人生数据本身来自 input，确定性不受影响
  useEffect(() => {
    if (!reduced) return;
    const t = window.setTimeout(onComplete, 900);
    return () => window.clearTimeout(t);
  }, [reduced, onComplete]);

  useEffect(() => {
    if (reduced || doneCount < rows.length) return;
    const t = window.setTimeout(onComplete, 700); // 三签齐定，留一息呼吸再翻页
    return () => window.clearTimeout(t);
  }, [reduced, doneCount, rows.length, onComplete]);

  return (
    <div className="screen drawing" role="status" aria-live="polite">
      <p className="drawing-head">{reduced || doneCount === rows.length ? '命签已落' : '命运正在落笔'}</p>
      <div className="reels">
        {rows.map((r, i) => (
          <Reel key={r.key} row={r} reduced={reduced} delay={reduced ? 0 : i * 340} onLocked={() => setDoneCount((d) => d + 1)} />
        ))}
      </div>
      <p className="drawing-foot" aria-hidden="true">· · ·</p>
    </div>
  );
}

function Reel({ row, reduced, delay, onLocked }: { row: RowDef; reduced: boolean; delay: number; onLocked: () => void }) {
  const [display, setDisplay] = useState(row.final);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false); // 为什么用 ref——onLocked 只许回调一次，StrictMode 双执行也可靠

  useEffect(() => {
    if (reduced) {
      // 降级：直接呈现真值
      setDisplay(row.final);
      setLocked(true);
      const t = window.setTimeout(onLocked, delay);
      return () => window.clearTimeout(t);
    }
    // 滚动序列：池随机重复 12 次后落到真值
    const seq: string[] = [];
    for (let i = 0; i < 12; i++) seq.push(row.pool[Math.floor(Math.random() * row.pool.length)]);
    seq.push(row.final);
    let i = 0;
    let gap = 55;
    let timer = 0;
    const step = () => {
      setDisplay(seq[i]);
      if (i === seq.length - 1) {
        setLocked(true);
        if (!lockedRef.current) {
          lockedRef.current = true;
          onLocked();
        }
        return;
      }
      i += 1;
      gap = Math.min(230, Math.round(gap * 1.22)); // 减速曲线——签停前的迟疑
      timer = window.setTimeout(step, gap);
    };
    const start = window.setTimeout(step, delay);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- row/delay 稳定（由 useMemo 派生），只跑一次
  }, [reduced]);

  return (
    <div className={`reel-row ${locked ? 'locked' : ''}`}>
      <span className="reel-label">{row.label}</span>
      <span className="reel-value" key={display}>
        {display}
      </span>
      <span className="reel-dot" aria-hidden="true" />
    </div>
  );
}

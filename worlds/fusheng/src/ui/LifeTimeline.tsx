// 人生时间轴：年份自动推进（~1.2s/年）、事件流式浮现（按 Domain 分色）、
// 四维刻度条随事件变动、抉择点暂停等待、era 事件视觉特殊化、死亡后终局。
// 键盘：空格=播放/暂停，回车=暂停时快进一年，数字 1-9=抉择（全键盘可玩）。
//
// 丝滑三律（为什么这样写）：
// 1. EventCard 用 memo——往年的卡是定稿，不该陪着今年重渲；
// 2. 事件流窗口化——一生 60+ 件事全铺在 DOM 里越走越沉，只精渲染最近 24 张，
//    更早的折叠成一行档案摘要（点击可展开回看）；
// 3. 自动滚动只在事件数变化时发生且走 rAF——scrollHeight 读取会强制布局，
//    高频连发 smooth 滚动是卡顿的元凶之一。
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LifeEvent, LifeResult, LifeState } from './engine';
import { INITIAL_STATE, applyEffects, DOMAIN_META, BARS } from './simState';
import { usePrefersReducedMotion } from './useReducedMotion';

const TICK_MS = 1200; // 任务契约：约 1.2 秒推进一年
const WINDOW = 24; // 精渲染窗口：最近 24 张事件卡（更早的折叠）

type PlayPhase = 'playing' | 'paused' | 'choice' | 'done';

export default function LifeTimeline({ result, onFinish }: { result: LifeResult; onFinish: () => void }) {
  const { events, deathAge } = result;
  const birthYear = result.input.birthYear;
  const reduced = usePrefersReducedMotion();

  const [idx, setIdx] = useState(0); // 已释放事件数（choice 事件决出后才计）
  const [year, setYear] = useState(birthYear - 1); // 当前推进到的年份
  const [state, setState] = useState<LifeState>(INITIAL_STATE);
  const [play, setPlay] = useState<PlayPhase>('playing');
  const [pending, setPending] = useState<LifeEvent | null>(null); // 待抉择事件
  const [answered, setAnswered] = useState<Record<string, number>>({}); // eventId → 选项下标
  const [lastFx, setLastFx] = useState<Partial<LifeState>>({}); // 最近一次变动（刻度条高亮/后果反馈用）
  const [fxVer, setFxVer] = useState(0);
  const [expanded, setExpanded] = useState(false); // 折叠区开关（回看完整档案）
  const feedRef = useRef<HTMLOListElement>(null);

  // ---- 核心：推进一年。释放该年全部事件，遇未决 choice 停住 ----
  const advanceYear = useCallback(() => {
    if (pending) return;
    const targetYear = year + 1;
    if (targetYear > birthYear + deathAge) {
      setPlay('done');
      return;
    }
    setYear(targetYear);
    let i = idx;
    let st = state;
    let fx: Partial<LifeState> = {};
    let hitChoice: LifeEvent | null = null;
    while (i < events.length && events[i].year <= targetYear) {
      const e = events[i];
      if (e.choice && answered[e.id] === undefined) {
        hitChoice = e; // 抉择点：本事件不释放、不计入 idx，等玩家落子
        break;
      }
      st = applyEffects(st, e.effects);
      if (e.effects) fx = e.effects;
      i += 1;
    }
    setState(st);
    setLastFx(fx);
    if (fx && Object.keys(fx).length) setFxVer((v) => v + 1);
    setIdx(i);
    if (hitChoice) {
      setPending(hitChoice);
      setPlay('choice');
    } else if (targetYear === birthYear + deathAge && i >= events.length) {
      setPlay('done'); // 死亡年事件放完，人生落幕
    }
  }, [pending, year, birthYear, deathAge, idx, state, events, answered]);

  // 挂载即释放出生年（age 0 的家庭事件），让时间轴有第一格
  useEffect(() => {
    advanceYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在挂载时跑一次
  }, []);

  // 自动播放：playing 之外的任何相位都停表
  useEffect(() => {
    if (play !== 'playing') return;
    const t = window.setInterval(() => advanceYear(), TICK_MS);
    return () => window.clearInterval(t);
  }, [play, advanceYear]);

  const choose = useCallback(
    (optIdx: number) => {
      if (!pending || !pending.choice || !pending.choice.options[optIdx]) return;
      const fx = pending.choice.options[optIdx].effects;
      setState((s) => applyEffects(s, fx));
      setLastFx(fx);
      setFxVer((v) => v + 1);
      setAnswered((a) => ({ ...a, [pending.id]: optIdx }));
      setIdx((i) => i + 1); // 抉择落定，事件正式入册
      setPending(null);
      setPlay('playing'); // 落子后命运继续滚动
    },
    [pending],
  );

  // 全局键盘：空格/回车/数字
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault(); // 防止页面滚动
        if (play === 'playing') setPlay('paused');
        else if (play === 'paused') setPlay('playing');
      } else if (e.key === 'Enter') {
        if (play === 'done') onFinish();
        else if (play === 'paused') advanceYear();
      } else if (play === 'choice' && /^[1-9]$/.test(e.key)) {
        choose(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play, advanceYear, choose, onFinish]);

  // 事件流自动滚到底：只在事件数变化时滚（rAF 延后读 scrollHeight，避免强制布局卡帧）
  useEffect(() => {
    if (expanded) return; // 回看档案时不抢滚动权
    const raf = requestAnimationFrame(() => {
      const el = feedRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [idx, reduced, expanded]);

  const visible = useMemo(() => {
    const list = events.slice(0, idx);
    if (pending) list.push(pending);
    return list;
  }, [events, idx, pending]);

  // 窗口化：折叠态只精渲染最近 WINDOW 张，更早的并成一行档案摘要
  const hiddenCount = expanded ? 0 : Math.max(0, visible.length - WINDOW);
  const shown = expanded ? visible : visible.slice(hiddenCount);

  // 中轴编年体：按年分组（年份节点小签），全局序号奇偶决定左右交错——
  // 编年的呼吸感来自"年份-事件-年份"的节拍，而不是一条平铺的列表
  const yearGroups = useMemo(() => {
    const groups: { year: number; items: { ev: LifeEvent; seq: number }[] }[] = [];
    let seq = hiddenCount;
    for (const ev of shown) {
      seq += 1;
      const last = groups[groups.length - 1];
      if (last && last.year === ev.year) last.items.push({ ev, seq });
      else groups.push({ year: ev.year, items: [{ ev, seq }] });
    }
    return groups;
  }, [shown, hiddenCount]);

  return (
    <div className="screen life">
      <header className="life-head">
        <div className="life-year">
          <span className="life-year-num" key={year} aria-live="off">{year}</span>
          <span className="life-age">{Math.max(0, year - birthYear)} 岁</span>
        </div>
        <StateBars state={state} lastFx={lastFx} fxVer={fxVer} />
        <div className="life-controls" role="group" aria-label="时间轴控制">
          {play === 'done' ? (
            <button type="button" className="primary-btn small" onClick={onFinish} autoFocus>
              终局
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ctrl-btn"
                onClick={() => setPlay(play === 'playing' ? 'paused' : 'playing')}
                aria-label={play === 'playing' ? '暂停' : '播放'}
                disabled={play === 'choice'}
              >
                {play === 'playing' ? '‖ 暂停' : '▶ 播放'}
              </button>
              <button type="button" className="ctrl-btn" onClick={advanceYear} aria-label="快进一年" disabled={play === 'choice'}>
                ↦ 快进
              </button>
            </>
          )}
        </div>
      </header>

      <ol className="event-feed chronicle" ref={feedRef} aria-label="人生事件流">
        {hiddenCount > 0 && (
          <li className="event-fold">
            <button type="button" className="event-fold-btn" onClick={() => setExpanded(true)}>
              ‥ 已走过 {hiddenCount} 件事——展开回看
            </button>
          </li>
        )}
        {yearGroups.map(({ year, items }) => (
          <Fragment key={year}>
            <li className={`chronicle-year${year % 10 === 0 ? ' major' : ''}`} aria-hidden="true">
              <span>{year}</span>
            </li>
            {items.map(({ ev, seq }) => (
              <li
                key={ev.id}
                className={`chronicle-item ${seq % 2 === 0 ? 'left' : 'right'}${ev.domain === 'era' ? ' era-full' : ''}${ev.effects?.alive === false ? ' era-full death-end' : ''}`}
              >
                <EventCard
                  ev={ev}
                  seq={seq}
                  answeredIdx={answered[ev.id]}
                  reduced={reduced}
                  onChoose={choose}
                  isDeath={ev.effects?.alive === false}
                />
              </li>
            ))}
          </Fragment>
        ))}
      </ol>

      <footer className="life-foot" aria-hidden="true">
        空格 播放/暂停 · 回车 快进{play === 'choice' ? ' · 按数字落子' : ''}
      </footer>
    </div>
  );
}

// ---- 四维刻度条：极简、域色、变动即闪 ----
function StateBars({ state, lastFx, fxVer }: { state: LifeState; lastFx: Partial<LifeState>; fxVer: number }) {
  return (
    <div className="bars" aria-label="人生四维">
      {BARS.map(({ key, label, colorVar }) => {
        const delta = (lastFx[key] as number | undefined) ?? 0;
        const bumped = fxVer > 0 && delta !== 0;
        return (
          <div className="bar-row" key={key}>
            <span className="bar-label">{label}</span>
            <span className="bar-track">
              <span
                className={`bar-fill${bumped ? ' bump' : ''}`}
                key={bumped ? `${key}-${fxVer}` : key}
                style={{ width: `${state[key]}%`, background: colorVar }}
              />
            </span>
            <span className={`bar-num${bumped ? ' bump' : ''}`} key={`n-${bumped ? `${key}-${fxVer}` : key}`}>
              {Math.round(state[key])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- 事件卡：域色点缀、文字为主；era 满宽变色；抉择可展开；死亡庄重 ----
// memo：往年的卡是定稿（props 恒定），不让它陪今年重渲——丝滑的关键
const EventCard = memo(function EventCard({
  ev,
  seq,
  answeredIdx,
  reduced,
  onChoose,
  isDeath,
}: {
  ev: LifeEvent;
  seq: number;
  answeredIdx: number | undefined;
  reduced: boolean;
  onChoose: (i: number) => void;
  isDeath: boolean;
}) {
  const meta = DOMAIN_META[ev.domain];
  const isChoice = !!ev.choice;
  const answered = isChoice && answeredIdx !== undefined;
  // 容器由外层 chronicle-item <li> 承担，卡片本体是 <div>（编年体的悬挂页）
  return (
    <div
      className={`event-card ${ev.domain}${isChoice ? ' choice' : ''}${answered ? ' answered' : ''}${isDeath ? ' death' : ''}${reduced ? ' no-anim' : ''}`}
    >
      <div className="event-top">
        <span className="event-dot" style={{ background: meta.colorVar }} aria-hidden="true" />
        <span className="event-meta">
          {ev.age} 岁 · {meta.label}
          <span className="event-seq">第 {seq} 件</span>
          {ev.domain === 'era' && ev.dataSource ? <span className="event-src">（{ev.dataSource}）</span> : null}
        </span>
      </div>
      <p className="event-text">{ev.text}</p>
      {isChoice && ev.choice && !answered && (
        <div className="choice-box" role="group" aria-label={ev.choice.prompt}>
          {ev.choice.options.map((o, i) => (
            <button type="button" key={o.label} className="choice-btn" onClick={() => onChoose(i)}>
              <span className="choice-key">{i + 1}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {answered && ev.choice && (
        <p className="choice-result">
          <span className="choice-picked">「{ev.choice.options[answeredIdx!].label}」</span>
          <FxBadges fx={ev.choice.options[answeredIdx!].effects} />
        </p>
      )}
    </div>
  );
});

// ---- effects 徽标：+2 / -3 的即时后果反馈 ----
function FxBadges({ fx }: { fx?: Partial<LifeState> }) {
  if (!fx) return null;
  const names: Partial<Record<keyof LifeState, string>> = { health: '健康', education: '学识', wealth: '家境', happiness: '心境' };
  const badges = (Object.keys(fx) as (keyof LifeState)[]).flatMap((k) => {
    if (k === 'alive') return [];
    const v = fx[k] as number | undefined;
    if (v === undefined || v === 0) return [];
    return [`${names[k]} ${v > 0 ? '+' : ''}${v}`];
  });
  if (!badges.length) return null;
  return (
    <span className="fx-badges">
      {badges.map((b) => (
        <span key={b} className="fx-badge">{b}</span>
      ))}
    </span>
  );
}

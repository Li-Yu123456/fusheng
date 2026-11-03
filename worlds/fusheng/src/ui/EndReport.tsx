// 终局报告：碑文式死亡年龄大字 + 与出生国均值对比 + 一生统计 + 时间轴回望缩略
// + 数据出处脚注（OWID 署名）+ 再来一世 / 复制此生链接（?seed= 全参数复现）。
import { useEffect, useMemo, useState } from 'react';
import type { Domain, LifeResult } from './engine';
import { DOMAIN_META } from './simState';
import { countryName, WORLD_SOURCE } from './worldAdapter';
import { usePrefersReducedMotion } from './useReducedMotion';

export default function EndReport({ result, shareLink, onRestart }: { result: LifeResult; shareLink: string; onRestart: () => void }) {
  const reduced = usePrefersReducedMotion();
  const { summary, events, input } = result;
  const [copied, setCopied] = useState(false);

  // 回望缩略：每岁一格，格色 = 该岁最后一个事件的域；era 年另加墨条
  const mosaic = useMemo(() => {
    const byAge = new Map<number, { domains: Set<Domain>; era: boolean }>();
    for (const e of events) {
      const cell = byAge.get(e.age) ?? { domains: new Set<Domain>(), era: false };
      cell.domains.add(e.domain);
      if (e.domain === 'era') cell.era = true;
      byAge.set(e.age, cell);
    }
    const cells: { age: number; main: Domain; era: boolean }[] = [];
    for (let a = 0; a <= summary.deathAge; a++) {
      const cell = byAge.get(a);
      cells.push({ age: a, main: cell ? [...cell.domains].pop()! : 'childhood', era: cell?.era ?? false });
    }
    return cells;
  }, [events, summary.deathAge]);

  // 与出生国均值的叙事对比
  const vsLine = useMemo(() => {
    const { pct } = summary.vsLex;
    // over 单独舍入：0.1 精度的十进制减法有二进制浮点尾（67.6-100 → …00006），
    // 不修就会把 32.400000000000006% 印在玩家脸上
    const over = Math.round((pct - 100) * 10) / 10;
    if (over >= 3) return `超过出生时的预期寿命 ${over}%`;
    if (over <= -3) return `比出生时的预期寿命短了 ${-over}%`;
    return '几乎分毫不差，走完均值人生';
  }, [summary]);

  // 出处去重（era 事件携带的 dataSource）
  const sources = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) if (e.dataSource) s.add(e.dataSource);
    return [...s];
  }, [events]);

  // Enter = 再来一世
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onRestart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRestart]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用（如非安全上下文）：退化为选中提示
      window.prompt('复制此生链接：', shareLink);
    }
  };

  return (
    <div className="screen end">
      <article className="end-card" aria-label="终局报告">
        <p className="end-kicker">终局</p>
        <p className={`end-age${reduced ? '' : ' rise'}`}>{summary.deathAge}</p>
        <p className="end-cause">{summary.cause}。</p>
        <p className="end-vs">
          活了 {summary.deathAge} 岁——{vsLine}（{countryName(input.country)} {input.birthYear} 年生人，人均 {Math.round(summary.vsLex.bornCountryLex)} 岁）
        </p>

        <div className="end-mosaic" aria-hidden="true">
          {mosaic.map((c) => (
            <span key={c.age} className={`mos-cell${c.era ? ' era' : ''}`} style={{ background: DOMAIN_META[c.main].colorVar }} title={`${c.age} 岁`} />
          ))}
        </div>
        <p className="mosaic-cap">
          {input.birthYear} — {summary.vsLex.died}，共 {summary.deathAge + 1} 格
        </p>

        <ul className="end-stats">
          <li>此生 {summary.stats.eventsSeen} 件事</li>
          <li>{summary.stats.choicesMade} 次抉择</li>
          <li>
            触达 {summary.stats.domainsTouched.length} 领域
            <span className="end-domains">
              {summary.stats.domainsTouched.map((d) => (
                <span key={d} className="domain-tag">
                  <i style={{ background: DOMAIN_META[d].colorVar }} />
                  {DOMAIN_META[d].label}
                </span>
              ))}
            </span>
          </li>
        </ul>

        <footer className="end-foot">
          <button type="button" className="ghost-btn" onClick={copyLink}>
            {copied ? '已复制' : '复制此生链接'}
          </button>
          <button type="button" className="primary-btn" onClick={onRestart} autoFocus>
            再来一世
          </button>
          <span className="key-hint">回车亦可</span>
        </footer>

        <p className="end-source">
          人生轨迹的骨架来自 {WORLD_SOURCE} 的公开统计（预期寿命 / 儿童死亡率 / 教育 / 收入）。
          {sources.length ? ` 时代事件出处：${sources.join('、')}。` : ''}
        </p>
      </article>
    </div>
  );
}

// 投胎设定页：「命运案头」双栏舞台。
// 左栏是宣言（巨字浮生+标语+投胎闸），右栏是卷宗（洲际印章墙/年代/性别/命签）——
// 为什么不对称双栏：居中表单流是工具的气质，命运该有一座案头。
// 为什么国籍用意象文案而不标难度——命运不该提前报价，暗示留在诗句里。
import { useMemo, useState, type FormEvent } from 'react';
import type { CountryMeta } from './worldAdapter';
import { listByContinent, countryYearRange } from './worldAdapter';
import { YEAR_MIN, YEAR_MAX, yearLabel } from './yearRange';
import { isDeepHistory } from '../engine/deepHistory';

export interface SetupDraft {
  seed: string; // '' = 随机
  country: string | null; // null = 交给命运
  birthYear: number | null;
  gender: 'm' | 'f' | null;
}

export default function SetupScreen({
  initial,
  countries,
  onSubmit,
}: {
  initial: SetupDraft;
  countries: CountryMeta[];
  onSubmit: (d: SetupDraft) => void;
}) {
  // 年代默认停在 YEAR_MIN：预填随机值会短路 App 的 seed 派生补全（?seed= 两次进入该同年同命），
  // 停在最早年代也更诚实——拖动才是选择。（初始 URL 带年则固化）
  const [country, setCountry] = useState<string | null>(initial.country);
  const [year, setYear] = useState<number>(initial.birthYear ?? YEAR_MIN);
  const [gender, setGender] = useState<'m' | 'f' | null>(initial.gender);
  const [seed, setSeed] = useState(initial.seed);

  // 滑块域：选了国家→该国真实寿命记录域；交给命运→全域（fate 抽样另有避开无值年份的逻辑）
  const range = useMemo(() => (country ? countryYearRange(country) : null) ?? { min: YEAR_MIN, max: YEAR_MAX }, [country]);
  const yMin = range.min;
  const yMax = range.max;
  const decades = useMemo(() => {
    const ds: number[] = [];
    for (let y = Math.ceil(yMin / 10) * 10; y <= yMax; y += 10) ds.push(y);
    return ds;
  }, [yMin, yMax]);
  // 所选国家的域不含当前年份时，收拢到域内（数据精准优先于记忆的选择）
  const effYear = Math.max(yMin, Math.min(yMax, year));

  // 洲际分组：出生地按洲列全（分组数据来自 worldAdapter，跨洲国口径见其注释）
  const groups = useMemo(() => listByContinent(), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ seed: seed.trim(), country, birthYear: effYear, gender });
  };

  return (
    <form className="screen setup-stage" onSubmit={submit} aria-label="投胎设定">
      {/* 左栏：宣言。巨字「浮生」是这个界面的主角 */}
      <aside className="stage-manifesto">
        <div className="manifesto-top">
          <h1 className="brand-hero" aria-label="浮生">浮生</h1>
          <p className="brand-vertical" aria-hidden="true">一场由真实数据押韵的人生</p>
        </div>
        <div className="manifesto-bottom">
          <p className="manifesto-note">
            一九五〇年至二〇一二年间的二十九国，<br />
            每一次投胎都由真实统计数据押韵。
          </p>
          <button type="submit" className="primary-btn stage-go">
            投 胎
          </button>
          <p className="manifesto-src">数据 · Our World in Data（CC BY 4.0）</p>
        </div>
      </aside>

      {/* 右栏：卷宗。四份设定档案，硬边分节 */}
      <div className="stage-dossier">
        <section className="dossier-sec" aria-label="选择国籍">
          <h2 className="dossier-label">壹 <span>生于何处</span></h2>
          <button
            type="button"
            role="option"
            aria-selected={country === null}
            className={`stamp fate ${country === null ? 'sel' : ''}`}
            onClick={() => setCountry(null)}
          >
            <span className="stamp-name">交给命运</span>
            <span className="stamp-hint">让签筒替你决定</span>
          </button>
          {groups.map(({ continent, countries: cs }) => (
            <div key={continent} className="stamp-group">
              <p className="stamp-group-title" aria-hidden="true">{continent}</p>
              <div className="stamp-wall" role="listbox" aria-label={`${continent}国籍`}>
                {cs.map((c) => (
                  <button
                    type="button"
                    role="option"
                    key={c.code}
                    aria-selected={country === c.code}
                    className={`stamp ${country === c.code ? 'sel' : ''}`}
                    onClick={() => setCountry(c.code)}
                    title={c.hint}
                  >
                    <span className="stamp-name">{c.zh}</span>
                    <span className="stamp-hint">{c.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="dossier-sec" aria-label="出生年份">
          <h2 className="dossier-label">贰 <span>生逢何年</span></h2>
          {isDeepHistory(effYear) && (
            <p className="deep-history-note" style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.08em' }}>
              深史时期（学术估计）· 数字来自人口学模型与骨骼考古，非分国真实记录
            </p>
          )}
          <div className="year-row">
            <output className="year-big" htmlFor="year-slider">
              {year}
            </output>
            <input
              id="year-slider"
              type="range"
              min={yMin}
              max={yMax}
              step={effYear < 1750 ? 10 : 1}
              value={yearLabel(effYear)}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="出生年份"
            />
          </div>
          <div className="year-ticks" aria-hidden="true">
            {decades.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </section>

        <section className="dossier-sec" aria-label="选择性别">
          <h2 className="dossier-label">叁 <span>身为何人</span></h2>
          <div className="gender-row" role="group" aria-label="选择性别">
            {([['m', '男'], ['f', '女'], [null, '听天由命']] as const).map(([g, label]) => (
              <button key={label} type="button" aria-pressed={gender === g} className={`chip ${gender === g ? 'sel' : ''}`} onClick={() => setGender(g)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="dossier-sec" aria-label="命签编号">
          <h2 className="dossier-label">肆 <span>命签编号</span></h2>
          <input
            className="seed-input"
            type="text"
            inputMode="numeric"
            placeholder="留空则随机"
            value={seed}
            onChange={(e) => setSeed(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
            aria-label="命签编号（种子，留空随机）"
          />
          <p className="field-note">同一编号，同一种人生——可复制给朋友，共赴一命。</p>
        </section>
      </div>
    </form>
  );
}

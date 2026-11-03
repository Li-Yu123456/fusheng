// 关键界面渲染测试：出生文书 / 终局报告（react-dom/server 静态渲染 + 真实引擎输出）。
// 为什么用这个姿势：浏览器 e2e 环境有抖动，而纯展示组件的渲染正确性完全可以在
// 确定性环境里永久回归——这一层测的是「界面上每个数字每句话都来自真数据」。
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 服务端渲染环境没有 window：usePrefersReducedMotion 的 useState 初始化器
// 会读 matchMedia——stub 成"无减弱动效"即可让组件树完整走一遍渲染
(globalThis as Record<string, unknown>).window = {
  matchMedia: () => ({ matches: false }),
};

import BirthReport from '../src/ui/BirthReport';
import EndReport from '../src/ui/EndReport';
import { simulate } from '../src/engine/life';
import { initWorld } from '../src/ui/worldAdapter';
import type { WorldData } from '../src/engine/types';

const world = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/data/world.json', import.meta.url)), 'utf-8'),
) as WorldData;

// 真实时序：浏览器里 main.tsx 先 await initWorld() 再挂载——SSR 测试同样先就位世界数据，
// 否则 countryName/getWorldLex 读到空模块态（国名退化成 ISO 码、世界均值「— 岁」）
await initWorld();

// seed=4/KOR/1950/m：引擎定的短命（享年 15），e2e 也用它——同一份人生三层验证（引擎/界面/e2e）
const LIFE = simulate({ seed: 4, country: 'KOR', birthYear: 1950, gender: 'm' }, world);

describe('出生文书渲染', () => {
  const html = renderToStaticMarkup(
    <BirthReport result={LIFE} onBegin={() => {}} />,
  );

  it('年份·国家·性别三要素落纸', () => {
    expect(html).toContain('1950');
    expect(html).toContain('韩国');
    expect(html).toContain('男');
  });

  it('真实数据叙事：出生国 lex 与全球真值同现', () => {
    // KOR 1950 lex≈22.2（OWID）；世界行 46.4——文书必须同页呈现两者的命运对比
    expect(html).toContain('22');
    expect(html).toContain('46');
    expect(html).toContain('岁');
  });

  it('「翻开此生」闸门在文书上', () => {
    expect(html).toContain('翻开此生');
  });
});

describe('终局报告渲染', () => {
  const html = renderToStaticMarkup(
    <EndReport result={LIFE} shareLink="http://x/?seed=4&c=KOR&y=1950&g=m" onRestart={() => {}} />,
  );

  it('享年大字 = 引擎死亡年龄（界面数字与引擎同源）', () => {
    expect(html).toContain(String(Math.floor(LIFE.deathAge)));
  });

  it('与出生国均值对比的叙事在（vsLex 数据链落到界面）', () => {
    // 界面上纸的是舍入后的差值 over = pct - 100（与组件同式），不是 pct 本身
    const over = Math.round((LIFE.summary.vsLex.pct - 100) * 10) / 10;
    expect(html).toContain(String(Math.abs(over)));
  });

  it('回望缩略：格数覆盖一生（mosaic 按岁铺格）', () => {
    const cells = (html.match(/mos-cell/g) ?? []).length;
    expect(cells).toBeGreaterThanOrEqual(Math.floor(LIFE.deathAge) * 0.8);
  });

  it('再来一世与复现入口都在', () => {
    expect(html).toContain('再来一世');
    expect(html).toContain('复制此生链接'); // shareLink 本体走剪贴板不上纸，按钮在即入口在
  });

  it('数据出处署名（CC BY 合规线）', () => {
    expect(html).toContain('Our World in Data');
  });

  it('一生统计入纸（事件数与抉择数来自引擎）', () => {
    expect(html).toContain(String(LIFE.summary.stats.eventsSeen));
  });
});

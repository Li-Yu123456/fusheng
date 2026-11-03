# 浮生 接口契约 v1（并行开发的命门）

> 各 worker 在自己地盘内自由发挥；跨地盘边界只认本文件。改契约需 lead 批准。

## 1. world.json（worker-1 产出 → worker-2 消费）

路径：`worlds/fusheng/src/data/world.json`

```jsonc
{
  "meta": {
    "source": "Our World in Data grapher CSV",
    "license": "CC-BY 4.0",
    "fetchedAt": "2026-11-01",
    "tables": { "life-expectancy": "sha256:...", "child-mortality": "sha256:..." }
  },
  "countries": {
    "CHN": {
      "name": { "zh": "中国" },
      "years": {
        "1995": { "lex": 69.8, "childMort": 37.0, "fertility": 1.79, "schooling": 7.1, "gdpPc": 1118 }
      }
    }
  }
}
```

- 国家集：G20 + 代表性补充共 29 国，年份 1950–2026 逐年（实测 2233 行无洞）。
- 字段允许缺失——引擎必须容忍 null 并降级。**实测：schooling 在 NGA/ETH 全段 null（该表无数据）、SAU/VNM 大部分 null**，教育事件链必须有 null 降级路径（用 gdpPc 或固定分布替代）。
- 单位：lex 岁；childMort 每 1000 活产的 5 岁前死亡数（**注意：OWID 原表单位是 %，管线已 ×10 转换并锚点核验**）；fertility 总和生育率；schooling 平均受教育年限；gdpPc 2017 国际元（Maddison PPP）。
- 实际 slug（两个 404 已换用）：life-expectancy / child-mortality / **total-fertility-rate** / mean-years-of-schooling / **gdp-per-capita-maddison**。
- §1 示例里的具体数字是结构示意；以 world.json 实际值为准（如 CHN 1995 childMort 实为 47.4‰、lex 实为 69.8 岁级别）。

## 2. 引擎接口（worker-2 实现 → worker-4 消费）

文件：`worlds/fusheng/src/engine/types.ts`（签名已冻结，实现细节自由）

```ts
export interface LifeInput { seed: number; country: string; birthYear: number; gender: 'm' | 'f'; }
export type Domain = 'childhood' | 'education' | 'career' | 'family' | 'health' | 'era';
export interface LifeState { alive: boolean; health: number; education: number; wealth: number; happiness: number; }
export interface Choice { prompt: string; options: { label: string; effects: Partial<LifeState>; }[]; }
export interface LifeEvent {
  age: number; year: number; domain: Domain; id: string;
  text: string;                  // 中文叙事，可插值 {name} 等
  effects?: Partial<LifeState>;
  choice?: Choice;               // 有 choice 的事件 = 抉择点
  dataSource?: string;           // 数据出处标记，终局报告引用
}
export interface DeathSummary {
  deathAge: number; cause: string;
  vsLex: { born: number; died: number; bornCountryLex: number; pct: number };  // 与出生国均值对比
  stats: { eventsSeen: number; choicesMade: number; domainsTouched: Domain[] };
}
export interface LifeResult { input: LifeInput; events: LifeEvent[]; deathAge: number; summary: DeathSummary; }
export function simulate(input: LifeInput, world: WorldData): LifeResult;  // 纯函数，确定性
export function makeRng(seed: number): () => number;                       // mulberry32
```

- 事件量：一次人生 ≥ 40 个事件、≥ 3 个抉择点；文案全中文、模板变量插值。
- era 域按真实年代触发（饥荒/战争/瘟疫用世界事件时间线，硬编码有出处的少数条目即可，M1 不要求完整）。
- 分布要求：10000 次模拟的寿命分位数 vs OWID lex 表误差 < 2%（`tests/distribution.test.ts`）。

## 3. hub API + SSE（worker-3 实现主页消费）

```
GET /api/pulse  → { "living": n, "births": n, "lives": n, "ended": n }      # JSON，proto:1
GET /api/stream?v=<nonce>  → SSE:
  event: birth        # 全球真实出生率 ~4.3/秒 节奏生成
  data: {"country":"NGA","gender":"f","name":"阿米娜","year":2026}
  （每 60s 一条 event: stat 快照；预留 event: notice 供 M2）
GET /worlds.json     → { "worlds": [ { "key": "fusheng", "host": null, "path": "/worlds/fusheng/", ... } ] }
```

- hub 零 npm 依赖（node:http 原生）；静态服务根 = 仓库根（`/` → home/dist/index.html，`/worlds/fusheng/` → 世界构建产物）。
- SSE 连接需处理断开清理；心跳注释行每 15s。

## 4. 视觉契约（worker-3 主页 / worker-4 世界共享）

- 基调：「命运感」——米色纸感底 `#f4efe6`（暗色 `#14161a`）、砖红点缀 `#b3542e`、墨色文字；Noto Serif SC（Google Fonts，`media=print` onload 换 `all` 异步加载 + `text=` 子集化思路）。
- 无障碍：`prefers-reduced-motion` 全部动画降级；375px 移动端适配；深浅双主题跟随系统。
- 动效克制：淡入/位移 ≤ 350ms，easing 用 ease-out。

## 5. 质量铁律（全员）

- console 零错误（开发和构建态都不得引入）。
- 不新增重量级依赖：react/react-dom 已有预算，其余 UI 库一律不用；hub/data-pipeline 零依赖。
- 交付前 `npm run build` 必须通过；worker-2/4 交付前 `npm test`（worlds/fusheng）必须绿。

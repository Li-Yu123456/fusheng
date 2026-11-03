# 浮生 Fusheng

> 数据叙事人生模拟世界：按真实统计（OWID 29 国 × 1950-2026 + 全球真值行）投胎，
> 在事件链网络里过完一生；每个玩家 0 门槛参与世界设计的全过程。

## 运行

```bash
npm install        # 首次
npm run build      # 字体子集检查 + 主页 + 世界构建
npm start          # hub 起在 http://localhost:4310（FUSHENG_PORT 可改）
```

- 主页：`http://localhost:4310/`（SSE 实时新生儿流，全球真实出生率 4.3/秒）
- 世界：`/worlds/fusheng/`——投胎 → 出生文书 → 人生时间轴（中轴编年体）→ 终局报告
- 议事厅：世界页右上竖签——许愿 → 顶票 → 提案 → 试验场 → 颁布（令牌在 hub 控制台）
- 复现一命：`/worlds/fusheng/?seed=42`（同号同命，逐字节一致）

## 命令

| 命令 | 作用 |
|---|---|
| `npm test` | 43 项测试：引擎黄金快照 / 分布校准（9 组合误差 <2%）/ 确定性 / **界面渲染**（文书+终局全要素上纸） |
| `npm run data` | 重跑 OWID 数据管线（含 Entity=World 真实全球行） |
| `node scripts/build-engine.mjs` | 引擎打包给 hub 试验场（与玩家同源） |
| `node scripts/sse-bench.mjs` | SSE 并发压测（50 连接×60s） |

## 四区架构

```
fusheng/
├── hub/            # 零依赖 node:http：静态 + SSE 出生流 + 议事厅 API + 试验场
│   ├── server.mjs  #   端口 4310；vendor/engine.mjs 是引擎的服务端同源副本
│   └── council.mjs #   民主集中流水线（持久化 hub/data/*.json）
├── home/           # 主页：vanilla ES modules → esbuild 内联单 HTML（gzip ~4.4KB）
├── worlds/fusheng/ # 世界：React 18 + TS + Vite
│   ├── src/engine/ #   确定性纯函数引擎（mulberry32 + 两段死亡模型 + 事件链）
│   ├── src/ui/     #   案头舞台 setup / 中轴编年时间轴 / 议事厅
│   └── tests/      #   43 项测试（含分布校准与界面渲染回归）
└── data-pipeline/  # OWID CSV → world.json（29 国逐年 + World 真值行，CC-BY 4.0）
```

## 验收状态（全部实证）

| 项 | 证据 |
|---|---|
| 引擎分布 | 9 组合 ×10000 次模拟，寿命均值 vs OWID 误差 0.21–0.65%（阈 2%） |
| 确定性 | 同 seed 两次加载 DOM sha256 一致；黄金快照回归 |
| SSE | 50 并发×60s 全存活、4.28/s、p50=233ms、0 错误 |
| 体积 | 世界主包 gzip 64KB（world.json 独立 chunk 33.7KB 懒加载）；主页 4.4KB |
| 界面渲染 | 终局/文书组件测试：享年、vsLex 对比（浮点已修）、mosaic 格数、署名全部上纸 |
| 议事厅全链路 | 许愿→顶票→试验（2100 次真跑）→三重门槛颁布→热上线，API+UI 实测闭环 |

## 已修复的关键缺陷（防复发清单）

childMort %→‰ 口径陷阱 / 世界均值伪精确（样本平均→OWID World 真值行）/ 事件同年重样与一生四讲 / era 隔年重讲 / seed 确定性被 Math.random 短路 / 终局对比浮点尾数（32.4000…06%）/ 投胎按钮在首屏视口外（sticky 案头修复）/ hub/data 目录缺失静默丢数据 / 字体 text= 超长被 Google 静默忽略（负结果已记录）/ 繁体字混入×2。

## 设计原则

- **真实客观**：所有对玩家呈现的数字都有数据出处；检验院式测试文化（黄金快照+分布校准）
- **视觉**：命运案头——米色纸感 × 砖红印章 × 衬线巨字 × 硬边墨线；深浅双主题、reduced-motion、375px、全键盘
- **民主集中**：玩的人就是造世界的人——投票民主 × 引擎科学审批 × 集中终审，每票真实计数

## M3 已上线（本地全链实测）

- **账号 SSO**：邮箱验证码登录（本地模式验证码在 hub 控制台与 hub/data/last-code.txt；上线换邮件 API 零改接口）、HttpOnly cookie、新邮箱起名即注册、不登录照玩
- **前世存档**：node:sqlite 原生存档，终局自动上报；「我的前世」可回看 20 世，一键「再赴此生」（?seed= 全参数重历）
- **全站公告**：hub 颁布（admin token）→ /nt/notice.js Shadow DOM 弹角标（closed 隔离+textContent 防 XSS+每设备每条一次）
- **一键启动**：双击 `开始浮生.command`（自动 cd/装依赖/构建/防重复起/开门）
- **部署演练**：`deploy/Caddyfile`（SSE 禁缓冲+自动 HTTPS）+ `deploy/DEPLOY.md`（DNS/系统d/备份/邮件切换全手册）——真上线只差域名与 VPS

## 已知限制（如实声明）

- 浏览器自动化在个别环境下抖动（GPU/沙箱）；界面正确性由 43 项测试永久回归兜底
- 议事厅动态文案不在字体子集内（回落系统宋体；text= 大子集被 Google 拒绝，负结果记录于 scripts/font-subset.mjs）

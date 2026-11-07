#!/usr/bin/env node
// hub/server.mjs —— 浮生中枢：静态托管 + SSE 新生儿流 + 心跳计数
// 为什么零 npm 依赖：CONTRACTS.md §3 规定 hub 零依赖（质量铁律），node:http 原生足够。

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleCouncil, serveCommunityEvents, flushNow, adminToken } from './council.mjs';
import { handleAuth, whoAmI } from './auth.mjs';
import { handleNotices } from './notice.serve.mjs';
import { handleArchive } from './archive.mjs';
import { randomBytes } from 'node:crypto';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.FUSHENG_PORT) || 4310;

// ---------------------------------------------------------------------------
// 国家人口权表 + 名字小库（原创编选：按各文化常识手写音译，不搬运任何现成产品名单）
// 为什么按人口加权：M1 主页要的是"全球真实感"的分布，人口表直观且可人工校验；
// 权重单位为百万（2026 年粗估），只需比例正确，绝对值不追求精确。
const COUNTRIES = [
  { c: 'IND', zh: '印度', p: 1450, m: ['阿尔琼', '维克拉姆', '罗希特'], f: ['阿莎', '普丽娅', '卡维塔'] },
  { c: 'CHN', zh: '中国', p: 1415, m: ['志远', '建国', '宇轩'], f: ['秀兰', '雨欣', '婉婷'] },
  { c: 'USA', zh: '美国', p: 340, m: ['詹姆斯', '迈克尔', '以赛亚'], f: ['艾米丽', '奥利维亚', '格蕾丝'] },
  { c: 'IDN', zh: '印度尼西亚', p: 283, m: ['阿古斯', '布迪', '桑托'], f: ['苏西', '丽娜', '德维'] },
  { c: 'PAK', zh: '巴基斯坦', p: 251, m: ['比拉勒', '乌斯曼', '伊姆兰'], f: ['阿伊莎', '法蒂玛', '扎伊娜布'] },
  { c: 'NGA', zh: '尼日利亚', p: 233, m: ['丘克', '埃梅卡', '易卜拉欣'], f: ['阿米娜', '佐拉', '奇德尔'] },
  { c: 'BRA', zh: '巴西', p: 213, m: ['若昂', '佩德罗', '卢卡斯'], f: ['玛丽亚', '卡米拉', '比阿特丽斯'] },
  { c: 'BGD', zh: '孟加拉国', p: 174, m: ['拉希姆', '萨吉尔', '塔里克'], f: ['莱莎', '纳兹玛', '莎尔敏'] },
  { c: 'RUS', zh: '俄罗斯', p: 144, m: ['伊万', '德米特里', '尼古拉'], f: ['安娜', '斯维特兰娜', '卡佳'] },
  { c: 'ETH', zh: '埃塞俄比亚', p: 133, m: ['特斯法耶', '凯贝德', '达尼埃尔'], f: ['阿贝芭', '梅塞蕾', '希鲁特'] },
  { c: 'MEX', zh: '墨西哥', p: 131, m: ['卡洛斯', '豪尔赫', '迭戈'], f: ['索菲亚', '露西亚', '瓦莱里娅'] },
  { c: 'JPN', zh: '日本', p: 123, m: ['拓海', '莲', '悠真'], f: ['美咲', '阳菜', '结衣'] },
  { c: 'PHL', zh: '菲律宾', p: 116, m: ['何塞', '保罗', '马尔科'], f: ['玛丽亚', '安娜', '乔斯'] },
  { c: 'EGY', zh: '埃及', p: 116, m: ['穆罕默德', '艾哈迈德', '哈桑'], f: ['努尔', '雅斯敏', '玛丽亚姆'] },
  { c: 'COD', zh: '刚果（金）', p: 106, m: ['姆瓦姆巴', '迪厄多内', '帕皮'], f: ['玛蒂尔德', '格蕾丝', '娜迪娅'] },
  { c: 'VNM', zh: '越南', p: 100, m: ['阮生', '明', '德'], f: ['芳', '玲', '梅'] },
  { c: 'IRN', zh: '伊朗', p: 92, m: ['阿里', '礼萨', '侯赛因'], f: ['莱拉', '萨拉', '纳尔盖斯'] },
  { c: 'TUR', zh: '土耳其', p: 87, m: ['穆斯塔法', '埃姆雷', '布拉特'], f: ['埃利夫', '泽伊内普', '塞达'] },
  { c: 'DEU', zh: '德国', p: 84, m: ['汉斯', '卢卡斯', '弗里德里希'], f: ['米娅', '汉娜', '莱亚'] },
  { c: 'THA', zh: '泰国', p: 72, m: ['颂猜', '阿南', '吉拉'], f: ['玛莉', '苏达', '彭'] },
  { c: 'GBR', zh: '英国', p: 69, m: ['奥利弗', '哈里', '乔治'], f: ['阿米莉亚', '艾拉', '夏洛特'] },
  { c: 'TZA', zh: '坦桑尼亚', p: 69, m: ['姆维塔', '朱马', '巴卡里'], f: ['内娅', '莎莉玛', '阿莎'] },
  { c: 'FRA', zh: '法国', p: 66, m: ['卢卡', '雨果', '加布里埃尔'], f: ['艾玛', '露易丝', '爱丽丝'] },
  { c: 'ZAF', zh: '南非', p: 63, m: ['西波', '塔博', '勒罗托'], f: ['蒂博', '莱博', '诺姆'] },
  { c: 'ITA', zh: '意大利', p: 59, m: ['马可', '卢卡', '安德烈'], f: ['朱莉娅', '索菲亚', '基娅拉'] },
  { c: 'KEN', zh: '肯尼亚', p: 57, m: ['卡马', '乔莫', '奥蒂恩'], f: ['万吉鲁', '妮娅奥卡', '阿凯'] },
  { c: 'MMR', zh: '缅甸', p: 55, m: ['丹', '觉莫', '妙'], f: ['苏苏', '妙南', '埃埃'] },
  { c: 'COL', zh: '哥伦比亚', p: 53, m: ['胡安', '安德烈斯', '卡米洛'], f: ['达妮埃拉', '宝拉', '卡罗利娜'] },
  { c: 'KOR', zh: '韩国', p: 52, m: ['敏俊', '瑞俊', '东贤'], f: ['智恩', '书妍', '夏媛'] },
  { c: 'UGA', zh: '乌干达', p: 50, m: ['基布卡', '奥凯洛', '罗纳德'], f: ['纳姆索莱', '阿坎', '格蕾丝'] },
  { c: 'SDN', zh: '苏丹', p: 50, m: ['穆萨', '奥斯曼', '阿德尔'], f: ['苏阿德', '胡达', '纳斯林'] },
  { c: 'DZA', zh: '阿尔及利亚', p: 47, m: ['优素福', '卡里姆', '萨米尔'], f: ['雅斯敏', '伊曼', '瓦希达'] },
  { c: 'ESP', zh: '西班牙', p: 48, m: ['巴勃罗', '哈维尔', '塞尔希奥'], f: ['玛尔塔', '埃莱娜', '卢西亚'] },
  { c: 'ARG', zh: '阿根廷', p: 46, m: ['马特奥', '圣地亚哥', '瓦伦丁'], f: ['瓦伦蒂娜', '胡莉埃塔', '卡米拉'] },
  { c: 'IRQ', zh: '伊拉克', p: 46, m: ['奥马尔', '穆斯塔法', '卡里姆'], f: ['鲁卡亚', '达娜', '努尔'] },
  { c: 'AFG', zh: '阿富汗', p: 43, m: ['阿卜杜拉', '贾瓦德', '纳迪尔'], f: ['玛丽亚姆', '法里达', '扎尔洪'] },
  { c: 'CAN', zh: '加拿大', p: 40, m: ['威廉', '诺亚', '利昂'], f: ['奥利维亚', '艾玛', '克洛伊'] },
  { c: 'AGO', zh: '安哥拉', p: 38, m: ['多明格斯', '保罗', '内托'], f: ['特蕾莎', '安娜', '玛丽亚'] },
  { c: 'POL', zh: '波兰', p: 38, m: ['雅各布', '彼得', '卡齐米日'], f: ['索菲亚', '玛雅', '汉卡'] },
  { c: 'MAR', zh: '摩洛哥', p: 38, m: ['哈立德', '伊德里斯', '塔里克'], f: ['伊曼', '海法', '萨拉'] },
  { c: 'MYS', zh: '马来西亚', p: 35, m: ['阿米尔', '法赫米', '达尼'], f: ['诺拉', '阿米娜', '普特里'] },
  { c: 'GHA', zh: '加纳', p: 35, m: ['科菲', '科乔', '亚奥'], f: ['阿科苏亚', '阿玛', '阿贝娜'] },
  { c: 'PER', zh: '秘鲁', p: 34, m: ['路易斯', '马科', '塞萨尔'], f: ['玛丽埃拉', '凡妮莎', '克劳迪娅'] },
  { c: 'SAU', zh: '沙特阿拉伯', p: 34, m: ['费萨尔', '哈立德', '萨乌德'], f: ['努拉', '莱拉', '达娜'] },
  { c: 'NPL', zh: '尼泊尔', p: 30, m: ['比什努', '克里什纳', '苏雷什'], f: ['萨丽塔', '卡玛拉', '安妮塔'] },
];

// 预累积权重：一次 O(n) 构建，之后每次抽样线性命中（45 国规模下无需二分/别名法）
const TOTAL_POP = COUNTRIES.reduce((s, x) => s + x.p, 0);

// worlds.json —— 多世界钩子：M1 单世界铁律，只有 fusheng；host 字段与 CONTRACTS.md §3 示例对齐
const WORLDS = {
  worlds: [
    {
      key: 'fusheng',
      host: null,
      name: { zh: '浮生' },
      path: '/worlds/fusheng/',
      desc: { zh: '按真实统计数据投胎，把这一生过到最后' },
      emoji: '♾️',
    },
    {
      key: 'abstract',
      host: null,
      name: { zh: '抽象宇宙' },
      path: '/worlds/abstract/',
      desc: { zh: '抽象人生 × 抽象词典 × 抽象新闻 × 抽象塔罗——四大抽象，一网打尽' },
      emoji: '😅',
    },
  ],
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.map': 'application/json',
};

// ---------------------------------------------------------------------------
// 进程级心跳计数
const counters = { births: 0, lives: 0, ended: 0 };
const clients = new Set(); // 活跃 SSE 连接；living 即其数量

function pulseSnapshot() {
  return { living: clients.size, births: counters.births, lives: counters.lives, ended: counters.ended };
}

// ---------------------------------------------------------------------------
// 新生儿生成
const BIRTH_BASE_MS = 1000 / 4.3; // ≈232.56ms：全球真实出生率约 4.3 人/秒
const NOW_YEAR = new Date().getFullYear();

function sampleCountry() {
  let r = Math.random() * TOTAL_POP;
  for (const c of COUNTRIES) {
    r -= c.p;
    if (r < 0) return c;
  }
  return COUNTRIES[COUNTRIES.length - 1];
}

function makeBirth() {
  const country = sampleCountry();
  const gender = Math.random() < 0.488 ? 'f' : 'm'; // 51.2% 男 / 48.8% 女（全球活产比）
  const pool = country[gender];
  return {
    country: country.c,
    gender,
    name: pool[(Math.random() * pool.length) | 0],
    year: NOW_YEAR,
  };
}

// ---------------------------------------------------------------------------
// SSE 帧写入
function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// 预留 M2 公告通道（版本发布/停机通知等），M1 仅保形
function sendNotice(res, payload) {
  sseSend(res, 'notice', payload ?? { type: 'none' });
}

function handleStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 反代（nginx 等）禁用缓冲，事件才能实时吐出
  });
  res.write('retry: 3000\n\n'); // 断线后 3s 重连，与 EventSource 原生语义配合
  clients.add(res);

  // 每连接独立节奏：±20% 抖动让多连接不同频，也避免与整秒对齐显得机械
  let birthTimer;
  const scheduleBirth = () => {
    const jitter = BIRTH_BASE_MS * (0.8 + Math.random() * 0.4);
    birthTimer = setTimeout(() => {
      counters.births += 1;
      sseSend(res, 'birth', makeBirth());
      scheduleBirth();
    }, jitter);
  };
  scheduleBirth();

  const pingTimer = setInterval(() => res.write(': ping\n\n'), 15000); // 心跳注释行，防中间层掐空闲连接
  const statTimer = setInterval(() => sseSend(res, 'stat', pulseSnapshot()), 60000);
  sseSend(res, 'stat', pulseSnapshot()); // 建连即发一帧，首屏无需再等 60s

  // 客户端断开必须立即清理，否则 living 虚高 + 定时器泄漏
  req.on('close', () => {
    clearTimeout(birthTimer);
    clearInterval(pingTimer);
    clearInterval(statTimer);
    clients.delete(res);
  });
}

// ---------------------------------------------------------------------------
// 静态服务
const placeholderWorld = (key) =>
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>浮生 · 世界铸造中</title><style>body{display:grid;place-items:center;min-height:100vh;margin:0;` +
  `background:#f4efe6;color:#26221d;font-family:'Noto Serif SC','Songti SC',serif;letter-spacing:.1em}</style></head>` +
  `<body><p style="font-size:15px;line-height:2;text-align:center">世界「${key}」正在铸造中<br>（M1 交付前的占位页）</p></body></html>`;

async function serveStatic(res, relPath) {
  // 安全线：resolve 消解 ../ 与编码绕过后，最终路径必须仍在仓库根内
  const abs = path.resolve(REPO_ROOT, '.' + path.sep + relPath);
  if (abs !== REPO_ROOT && !abs.startsWith(REPO_ROOT + path.sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const data = await readFile(abs);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
}

// 世界目录：dist 内未知路径回退其 index.html（SPA fallback）；dist 未建成时给占位页
async function serveWorld(res, worldKey, rest) {
  const distDir = path.join(REPO_ROOT, 'worlds', worldKey, 'dist');
  const target = path.resolve(distDir, '.' + path.sep + (rest || 'index.html'));
  const inside = target === distDir || target.startsWith(distDir + path.sep);
  if (!inside) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const data = await readFile(target);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    try {
      const data = await readFile(path.join(distDir, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch {
      res.writeHead(200, { 'Content-Type': MIME['.html'] }).end(placeholderWorld(worldKey));
    }
  }
}

// ---------------------------------------------------------------------------
// 路由
async function handle(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (pathname === '/api/pulse' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(pulseSnapshot()));
    return;
  }
  // M1 的 POST /api/lives 计数路由已并入 M3 存档端点（archive.mjs 里 POST /api/lives
  // 存档成功后回传脉冲）——同一路径两个语义是路由冲突，此处不再拦截
  if (pathname === '/api/ended' && req.method === 'POST') {
    counters.ended += 1;
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(pulseSnapshot()));
    return;
  }
  if (pathname === '/api/stream' && req.method === 'GET') {
    handleStream(req, res); // ?v=<nonce> 仅用于绕过缓存，服务端无需读取
    return;
  }
  if (pathname === '/worlds.json' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify(WORLDS));
    return;
  }
  // 议事厅（M2 民主共创）：API 与世界端热池分发
  if (await handleCouncil(req, res, pathname)) return;
  if (pathname === '/nt/community-events.json' && req.method === 'GET') {
    await serveCommunityEvents(res);
    return;
  }
  // M3：无密码 SSO / 公告注入 / 前世存档
  if (await handleAuth(req, res, pathname)) return;
  if (await handleNotices(req, res, pathname, adminToken())) return;
  const me = await whoAmI(req);
  if (await handleArchive(req, res, pathname, me.signed ? me.email : null)) return;

  // 静态：只开放两条白名单路径（任务书规定的服务面），仓库根其余文件一律 404——
  // 曾有通配静态分支会让 /package.json 等根文件可读，属越权面，已收紧
  if (pathname === '/' || pathname === '/index.html') {
    await serveStatic(res, 'home/dist/index.html');
    return;
  }
  const worldMatch = pathname.match(/^\/worlds\/([^/]+)\/?(.*)$/);
  if (worldMatch) {
    // 多世界钩子：M1 只有 fusheng 一个世界已注册，但路由按目录名通用分发
    const registered = WORLDS.worlds.some((w) => w.key === worldMatch[1]);
    if (!registered) {
      res.writeHead(404).end('unknown world');
      return;
    }
    await serveWorld(res, worldMatch[1], worldMatch[2]);
    return;
  }
  res.writeHead(404).end('not found');
}

const server = http.createServer((req, res) => {
  Promise.resolve(handle(req, res)).catch((err) => {
    console.error('[hub] 请求处理异常:', err);
    if (!res.headersSent) res.writeHead(500).end('internal error');
    else res.end();
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // 端口被占：大概率是浮生已在运行（双击启动/上次没关）。确认是我们的服务就指路，不是就说明冲突。
    fetch(`http://localhost:${PORT}/api/pulse`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.living === 'number') {
          console.log(`浮生已在运行——直接打开 http://localhost:${PORT} 即可（无需再启动）`);
          process.exit(0);
        } else {
          console.error(`端口 ${PORT} 被其他程序占用。可改端口：FUSHENG_PORT=4311 npm start`);
          process.exit(1);
        }
      })
      .catch(() => {
        console.error(`端口 ${PORT} 被其他程序占用。可改端口：FUSHENG_PORT=4311 npm start`);
        process.exit(1);
      });
    return;
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`[hub] 浮生中枢已启动 http://localhost:${PORT} （静态根 ${REPO_ROOT}）`);
  // 集中端令牌：环境变量优先；本地玩法没有 env 时生成一次性令牌打印在控制台（议事厅「颁布」用）
  if (!adminToken()) {
    const oneShot = randomBytes(4).toString('hex');
    process.env.FUSHENG_ADMIN_TOKEN = oneShot;
    console.log(`[hub] 议事厅本会话颁布令牌: ${oneShot}`);
  } else {
    console.log('[hub] 议事厅颁布令牌: 来自 FUSHENG_ADMIN_TOKEN');
  }
});

// SIGINT 优雅关闭：先通知所有流式客户端再退出，避免浏览器端报网络错误刷屏
process.on('SIGINT', () => {
  console.log('\n[hub] SIGINT，正在收束连接……');
  flushNow().catch(() => {}); // 议事厅民意落盘后再走
  for (const res of clients) {
    try {
      sendNotice(res, { type: 'shutdown' });
      res.end();
    } catch {
      /* 连接已死则跳过 */
    }
  }
  clients.clear();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref(); // 兜底：残留连接最多拖 1.5s
});

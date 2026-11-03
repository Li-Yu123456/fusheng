// hub/council.mjs —— 议事厅：许愿 → 顶票 → 提案 → 试验场 → 颁布的民主集中流水线。
// 设计原则（真链路，不做摆设）：
//   每一票真实计数、每份检验真实跑「与玩家同一份引擎」（hub/vendor/engine.mjs）、
//   每次颁布真实改变所有玩家的事件池（热上线，无需发版）。
// 持久化：hub/data/*.json（启动读、变更防抖 1s 落盘）；重启不丢民意。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(REPO_ROOT, 'hub', 'data');

// ---------------------------------------------------------------------------
// 持久层（三个 JSON 文件，零依赖）
const FILES = {
  wishes: path.join(DATA_DIR, 'wishes.json'),
  proposals: path.join(DATA_DIR, 'proposals.json'),
  community: path.join(DATA_DIR, 'community.json'), // 已上线社区事件（热池）
};
const EMPTY = { seq: 0, items: [] };

async function loadFile(file) {
  try {
    return JSON.parse(await readFile(file, 'utf-8'));
  } catch {
    return { ...EMPTY, items: [] };
  }
}

const db = {
  wishes: await loadFile(FILES.wishes),
  proposals: await loadFile(FILES.proposals),
  community: await loadFile(FILES.community),
};

// 数据目录必须先建（loadFile 对不存在的目录返回空，落盘没有目录会静默丢民意）
await mkdir(DATA_DIR, { recursive: true });

let flushTimer = null;
function persist() {
  // 防抖落盘：议事厅写入频率低，1s 合并足够；进程退出前由 SIGINT 钩子强制刷
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    for (const [k, file] of Object.entries(FILES)) {
      writeFile(file, JSON.stringify(db[k]), 'utf-8').catch(() => {});
    }
  }, 1000);
}
export async function flushNow() {
  clearTimeout(flushTimer);
  await Promise.all(Object.entries(FILES).map(([k, file]) => writeFile(file, JSON.stringify(db[k]), 'utf-8')));
}

// ---------------------------------------------------------------------------
// 引擎（与玩家同源）与世界数据
let engine = null;
let worldData = null;

async function ensureEngine() {
  if (!engine) {
    engine = await import('./vendor/engine.mjs');
    // 启动即把已上线社区事件并入热池（setExtraEvents 内含 id 校验）
    engine.setExtraEvents(db.community.items);
  }
  if (!worldData) {
    worldData = JSON.parse(await readFile(path.join(REPO_ROOT, 'worlds', 'fusheng', 'src', 'data', 'world.json'), 'utf-8'));
  }
  return engine;
}

// ---------------------------------------------------------------------------
// 公民与节流
function citizenOf(req) {
  // 0 门槛匿名：客户端 localStorage 自持 UUID；不带也能玩（用连接特征兜底），投票防重靠它
  return String(req.headers['x-citizen-id'] || '').slice(0, 64) || `anon-${randomBytes(6).toString('hex')}`;
}

const rateBucket = new Map(); // `${citizen}:${kind}` → ts
function throttle(citizen, kind, ms = 60_000) {
  const key = `${citizen}:${kind}`;
  const now = Date.now();
  if ((rateBucket.get(key) ?? 0) > now - ms) return false;
  rateBucket.set(key, now);
  return true;
}

// ---------------------------------------------------------------------------
// 试验场：配对种子对照试验（科学审批——同 seed 序列跑「当前池 vs 当前池+提案」，
// 差值即提案的净效应，方差远小于独立抽样）
const PROBES = [
  { country: 'CHN', birthYear: 1990, gender: 'm' },
  { country: 'JPN', birthYear: 1990, gender: 'f' },
  { country: 'NGA', birthYear: 1990, gender: 'm' },
];
const N_PER_PROBE = 700;

async function runTrial(draft) {
  const eng = await ensureEngine();
  const live = db.community.items;
  const trialEvent = eng.normalizeDraft(draft, 900000 + db.proposals.seq); // 试验 id：不入正式序

  const runPool = (pool) => {
    eng.setExtraEvents(pool);
    let lex = 0;
    let child = 0;
    let events = 0;
    let n = 0;
    for (const p of PROBES) {
      for (let i = 0; i < N_PER_PROBE; i++) {
        const r = eng.simulate({ seed: 1000 + i, ...p }, worldData);
        lex += r.deathAge;
        if (r.deathAge < 5) child += 1;
        events += r.events.length;
        n += 1;
      }
    }
    return { lex: +(lex / n).toFixed(2), childRate: +(child / n).toFixed(4), events: +(events / n).toFixed(1) };
  };

  const base = runPool(live);
  const treatment = runPool(live.concat([trialEvent]));
  eng.setExtraEvents(live); // 回滚：试验不污染线上池

  const lexPct = base.lex > 0 ? ((treatment.lex - base.lex) / base.lex) * 100 : 0;
  return {
    n: N_PER_PROBE * PROBES.length,
    base,
    treatment,
    lexPct: +lexPct.toFixed(2),
    fired: treatment.events > base.events, // 事件量必须真增加，否则窗口/条件永远抽不到=无效设计
    pass: Math.abs(lexPct) < 2 && treatment.events > base.events,
  };
}

// ---------------------------------------------------------------------------
// 颁布（集中裁决）：民主门槛（≥2 顶）+ 科学门槛（检验 pass）双达标才可颁布
export function adminToken() {
  return process.env.FUSHENG_ADMIN_TOKEN || null;
}

async function enact(p) {
  const eng = await ensureEngine();
  db.community.seq += 1;
  const tpl = eng.normalizeDraft(p.draft, db.community.seq);
  db.community.items.push(tpl);
  eng.setExtraEvents(db.community.items); // 立即热生效（此后所有新人生都含它）
  p.status = 'live';
  p.enactedAt = Date.now();
  persist();
  return tpl;
}

// ---------------------------------------------------------------------------
// 路由处理（返回 true 表示已处理）
export async function handleCouncil(req, res, pathname) {
  if (!pathname.startsWith('/api/council')) return false;
  const citizen = citizenOf(req);

  const json = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const readBody = () =>
    new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', (c) => {
        buf += c;
        if (buf.length > 8192) reject(new Error('body too large'));
      });
      req.on('end', () => {
        try {
          resolve(buf ? JSON.parse(buf) : {});
        } catch {
          reject(new Error('invalid json'));
        }
      });
      req.on('error', reject);
    });

  // ---- 看板 / 列表 ----
  if (req.method === 'GET' && pathname === '/api/council') {
    await ensureEngine();
    json(200, {
      wishes: db.wishes.items,
      proposals: db.proposals.items,
      liveEvents: db.community.items,
      stats: {
        wishes: db.wishes.items.length,
        proposals: db.proposals.items.length,
        live: db.community.items.length,
        boosts: db.wishes.items.reduce((s, w) => s + w.boosts.length, 0) + db.proposals.items.reduce((s, p) => s + p.boosts.length, 0),
      },
    });
    return true;
  }

  // ---- 许愿 ----
  if (req.method === 'POST' && pathname === '/api/council/wishes') {
    const body = await readBody();
    const text = String(body.text ?? '').trim();
    if (text.length < 2 || text.length > 140) return json(400, { error: '愿望须为 2–140 字' }), true;
    if (!throttle(citizen, 'wish')) return json(429, { error: '歇一口气，一分钟后再许' }), true;
    db.wishes.seq += 1;
    const wish = { id: `w${db.wishes.seq}`, text, by: citizen, boosts: [], created: Date.now() };
    db.wishes.items.unshift(wish);
    persist();
    json(201, wish);
    return true;
  }
  const boostWish = pathname.match(/^\/api\/council\/wishes\/(w\d+)\/boost$/);
  if (req.method === 'POST' && boostWish) {
    const w = db.wishes.items.find((x) => x.id === boostWish[1]);
    if (!w) return json(404, { error: '愿望不存在' }), true;
    if (w.boosts.includes(citizen)) return json(200, { ok: true, boosts: w.boosts.length, repeat: true }), true;
    w.boosts.push(citizen);
    persist();
    json(200, { ok: true, boosts: w.boosts.length });
    return true;
  }

  // ---- 提案 ----
  if (req.method === 'POST' && pathname === '/api/council/proposals') {
    const body = await readBody();
    if (!throttle(citizen, 'propose', 120_000)) return json(429, { error: '提案间隔两分钟——想清楚再提' }), true;
    const eng = await ensureEngine();
    const v = eng.validateDraft(body.draft ?? body);
    if (!v.ok) return json(400, { error: v.error }), true;
    db.proposals.seq += 1;
    const p = {
      id: `p${db.proposals.seq}`,
      by: citizen,
      wishId: body.wishId && /^w\d+$/.test(body.wishId) ? body.wishId : null,
      draft: v.draft,
      status: 'open', // open → verified → live（或 rejected）
      boosts: [],
      created: Date.now(),
    };
    db.proposals.items.unshift(p);
    persist();
    json(201, p);
    return true;
  }

  const boostProp = pathname.match(/^\/api\/council\/proposals\/(p\d+)\/boost$/);
  if (req.method === 'POST' && boostProp) {
    const p = db.proposals.items.find((x) => x.id === boostProp[1]);
    if (!p) return json(404, { error: '提案不存在' }), true;
    if (p.boosts.includes(citizen)) return json(200, { ok: true, boosts: p.boosts.length, repeat: true }), true;
    p.boosts.push(citizen);
    persist();
    json(200, { ok: true, boosts: p.boosts.length });
    return true;
  }

  const verify = pathname.match(/^\/api\/council\/proposals\/(p\d+)\/verify$/);
  if (req.method === 'POST' && verify) {
    const p = db.proposals.items.find((x) => x.id === verify[1]);
    if (!p) return json(404, { error: '提案不存在' }), true;
    // 检验门槛：提出者之外至少 1 人顶过（群众初审），避免机器空转
    const others = p.boosts.filter((c) => c !== p.by).length;
    if (others < 1) return json(403, { error: '先请至少一位同伴顶起这份提案，再开试验' }), true;
    const report = await runTrial(p.draft);
    p.report = { ...report, ranAt: Date.now() };
    if (report.pass) p.status = 'verified';
    persist();
    json(200, { ok: true, report: p.report, status: p.status });
    return true;
  }

  const enactMatch = pathname.match(/^\/api\/council\/proposals\/(p\d+)\/enact$/);
  if (req.method === 'POST' && enactMatch) {
    if (!adminToken() || req.headers['x-admin-token'] !== adminToken()) return json(401, { error: '颁布须管理者令牌（集中端）' }), true;
    const p = db.proposals.items.find((x) => x.id === enactMatch[1]);
    if (!p) return json(404, { error: '提案不存在' }), true;
    if (p.status !== 'verified') return json(409, { error: '须先通过试验场检验' }), true;
    if (p.boosts.length < 2) return json(409, { error: '民主门槛未达：至少 2 人顶' }), true;
    const tpl = await enact(p);
    json(200, { ok: true, enacted: tpl.id, status: 'live' });
    return true;
  }

  json(404, { error: 'unknown council route' });
  return true;
}

// 世界端拉取热池（议事厅颁布的社区事件，UI 端 extendEvents 并入）
export async function serveCommunityEvents(res) {
  await ensureEngine();
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify({ events: db.community.items }));
}

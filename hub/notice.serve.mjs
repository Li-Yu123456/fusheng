// hub/notice.serve.mjs —— 公告注入（M3）：hub 统一下发 notice.js（Shadow DOM 弹角标，
// 不受游戏样式影响——nevatown notice.js 的架构模式，代码原创）。
//   GET /nt/notice.js      世界/主页各引一行 <script defer>，自动拉 /nt/notices.json
//   GET /nt/notices.json   活动公告列表（hub/data/notices.json）
//   POST /api/notices      颁布公告（admin token；M3 集中端唯一内容入口）
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');
const NOTICE_JS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'notice.js');
await mkdir(DATA_DIR, { recursive: true });

async function loadNotices() {
  try {
    return JSON.parse(await readFile(NOTICES_FILE, 'utf-8'));
  } catch {
    return { items: [] };
  }
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

export async function handleNotices(req, res, pathname, adminToken) {
  if (pathname === '/nt/notice.js' && req.method === 'GET') {
    try {
      const js = await readFile(NOTICE_JS, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(js);
    } catch {
      res.writeHead(500).end('notice.js missing');
    }
    return true;
  }
  if (pathname === '/nt/notices.json' && req.method === 'GET') {
    json(res, 200, await loadNotices());
    return true;
  }
  if (pathname === '/api/notices' && req.method === 'POST') {
    if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
      json(res, 401, { error: '颁布公告须管理者令牌' });
      return true;
    }
    let body = '';
    await new Promise((r) => {
      req.on('data', (c) => (body += c));
      req.on('end', r);
    });
    let parsed;
    try {
      parsed = JSON.parse(body || '{}');
    } catch {
      json(res, 400, { error: 'invalid json' });
      return true;
    }
    const text = String(parsed.text ?? '').trim();
    if (text.length < 2 || text.length > 300) {
      json(res, 400, { error: '公告须为 2–300 字' });
      return true;
    }
    const data = await loadNotices();
    const item = {
      id: `n${Date.now().toString(36)}`,
      text,
      until: Number(parsed.until) || Date.now() + 7 * 24 * 3600_000, // 默认展示 7 天
      at: Date.now(),
    };
    data.items = [item, ...data.items].slice(0, 20);
    await writeFile(NOTICES_FILE, JSON.stringify(data), 'utf-8');
    json(res, 201, item);
    return true;
  }
  return false;
}

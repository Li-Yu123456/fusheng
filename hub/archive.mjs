// hub/archive.mjs —— 前世存档（node:sqlite 原生，零 npm 依赖）：
//   终局时 UI 上报一生摘要，按公民 id（匿名可存）+ 账号（登录可跨设备）双键归档。
//   「前世」是浮生的情绪资产：每一世都值得被记住。
import { DatabaseSync } from 'node:sqlite';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
await mkdir(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'archive.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS lives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    citizen TEXT NOT NULL,
    account TEXT,
    seed INTEGER NOT NULL,
    country TEXT NOT NULL,
    birth_year INTEGER NOT NULL,
    gender TEXT NOT NULL,
    death_age REAL NOT NULL,
    events INTEGER NOT NULL,
    ended_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lives_citizen ON lives(citizen, ended_at DESC);
`);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => {
      buf += c;
      if (buf.length > 4096) reject(new Error('too large'));
    });
    req.on('end', () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        reject(new Error('invalid json'));
      }
    });
  });
}

export async function handleArchive(req, res, pathname, accountEmail) {
  const json = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  if (!pathname.startsWith('/api/lives')) return false;

  const citizen = String(req.headers['x-citizen-id'] || 'anon').slice(0, 64);

  if (req.method === 'POST' && pathname === '/api/lives') {
    const b = await readBody(req);
    const seed = Number(b.seed);
    const year = Number(b.birthYear);
    const death = Number(b.deathAge);
    const events = Number(b.events);
    if (!Number.isInteger(seed) || !Number.isInteger(year) || !Number.isFinite(death) || !Number.isInteger(events)
      || !/^[A-Z]{3}$/.test(String(b.country ?? '')) || !/^[mf]$/.test(String(b.gender ?? ''))) {
      json(400, { error: 'bad payload' });
      return true;
    }
    db.prepare('INSERT INTO lives (citizen, account, seed, country, birth_year, gender, death_age, events, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(citizen, accountEmail ?? null, seed, b.country, year, b.gender, death, events, Date.now());
    json(201, { ok: true, lives: 1 }); // lives=1：接住 M1「开局计数」的旧语义（UI 以此显示人生数）
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/lives/me') {
    const rows = db.prepare(
      'SELECT seed, country, birth_year, gender, death_age, events, ended_at FROM lives WHERE citizen = ? OR account = ? ORDER BY ended_at DESC LIMIT 20',
    ).all(citizen, accountEmail ?? '');
    json(200, { lives: rows });
    return true;
  }
  json(404, { error: 'unknown archive route' });
  return true;
}

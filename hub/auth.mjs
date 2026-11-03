// hub/auth.mjs —— 涅瓦式无密码 SSO（本地 M3 版）：
//   邮箱收验证码 → 新邮箱起名注册 / 老邮箱直接登录 → nt_acct cookie（HttpOnly）。
//   本地投递：验证码打印到 hub 控制台 + 落 hub/data/last-code.txt（真上线换 SMTP，
//   接口不变——UI 与流程零改动，这是刻意的投递层隔离）。
// 存储：hub/data/accounts.json（token→账号）+ 内存码表（重启作废，安全默认）。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const COOKIE = 'nt_acct';

await mkdir(DATA_DIR, { recursive: true });

async function loadAccounts() {
  try {
    return JSON.parse(await readFile(ACCOUNTS_FILE, 'utf-8'));
  } catch {
    return { byToken: {}, byEmail: {} }; // byToken: token→{email,name,created}；byEmail: email→token
  }
}
async function saveAccounts(a) {
  await writeFile(ACCOUNTS_FILE, JSON.stringify(a), 'utf-8');
}

// ---- 码表（内存）：email → {code, expires, tries, sentAt} ----
const codes = new Map();
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,10}$/;
const NAME_RE = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9_]{2,16}$/u;

function cookieOf(req) {
  const raw = req.headers.cookie ?? '';
  const m = raw.match(new RegExp(`${COOKIE}=([A-Za-z0-9_-]+)`));
  return m ? m[1] : null;
}

export async function whoAmI(req) {
  const token = cookieOf(req);
  if (!token) return { signed: false };
  const acc = await loadAccounts();
  const a = acc.byToken[token];
  return a ? { signed: true, name: a.name, email: a.email } : { signed: false };
}

function json(res, code, obj, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(obj));
}

const readBody = (req) =>
  new Promise((resolve, reject) => {
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

export async function handleAuth(req, res, pathname) {
  if (!pathname.startsWith('/api/auth')) return false;
  const citizen = String(req.headers['x-citizen-id'] || 'anon');

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    json(res, 200, await whoAmI(req));
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/auth/request') {
    const body = await readBody(req);
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return json(res, 400, { error: '邮箱格式不对' }), true;
    const prev = codes.get(email);
    if (prev && Date.now() - prev.sentAt < 60_000) return json(res, 429, { error: '验证码一分钟一封，稍等' }), true;
    const code = String(100000 + Math.floor(Math.random() * 900000));
    codes.set(email, { code, expires: Date.now() + 10 * 60_000, tries: 0, sentAt: Date.now() });
    // 本地投递（上线换 SMTP）：控制台 + 文件双通道留档
    console.log(`[auth] ${email} 的验证码: ${code}`);
    await writeFile(path.join(DATA_DIR, 'last-code.txt'), `${email} ${code}\n`, 'utf-8').catch(() => {});
    // 回环直连（本机开发）才把码回传给 UI——按连接地址判断而非环境变量：
    // 公网部署即使忘了配 SMTP，外网请求也永远拿不到码，无法被用于枚举登录
    const ip = req.socket.remoteAddress ?? '';
    const loopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    json(res, 200, { ok: true, ...(loopback ? { devCode: code } : {}) });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/auth/verify') {
    const body = await readBody(req);
    const email = String(body.email ?? '').trim().toLowerCase();
    const code = String(body.code ?? '').trim();
    const name = String(body.name ?? '').trim();
    const rec = codes.get(email);
    if (!rec || Date.now() > rec.expires) return json(res, 400, { error: '验证码已过期，请重新获取' }), true;
    if (rec.tries >= 5) return json(res, 429, { error: '错太多次了，请重新获取' }), true;
    if (code !== rec.code) {
      rec.tries += 1;
      return json(res, 400, { error: '验证码不对' }), true;
    }
    codes.delete(email);
    const acc = await loadAccounts();
    let account = acc.byEmail[email];
    if (!account) {
      // 新邮箱：起名才算落户（名字是身份的最小载体）
      if (!NAME_RE.test(name)) return json(res, 400, { error: '名字须为 2–16 位：汉字/假名/字母/数字/下划线' }), true;
      const token = randomBytes(24).toString('base64url');
      acc.byEmail[email] = token;
      acc.byToken[token] = { email, name, created: Date.now() };
      await saveAccounts(acc);
      return json(res, 200, { signed: true, name, fresh: true }, { 'Set-Cookie': `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` }), true;
    }
    const token = acc.byEmail[email];
    await saveAccounts(acc);
    json(res, 200, { signed: true, name: acc.byToken[token].name }, { 'Set-Cookie': `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000` });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/auth/signout') {
    const token = cookieOf(req);
    if (token) {
      const acc = await loadAccounts();
      const a = acc.byToken[token];
      if (a) delete acc.byToken[token], delete acc.byEmail[a.email];
      await saveAccounts(acc);
    }
    json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` });
    return true;
  }
  json(res, 404, { error: 'unknown auth route' });
  return true;
}

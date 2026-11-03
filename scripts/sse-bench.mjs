// SSE 并发验收（计划验收 5）：50 并发连接 × 60s，统计存活率、事件吞吐与到达间隔。
// 为什么手写解析：node 主线程无全局 EventSource（v22+ 仅实验旗标下可用），零依赖对齐 hub。
import http from 'node:http';

const N = Number(process.env.N ?? 50);
const SECS = Number(process.env.SECS ?? 60);
const PORT = Number(new URL(process.env.URL ?? 'http://localhost:4310/api/stream?v=bench').port);
const PATH = new URL(process.env.URL ?? 'http://localhost:4310/api/stream?v=bench').pathname + (new URL(process.env.URL ?? 'http://localhost:4310/api/stream?v=bench').search);

const t0 = Date.now();
let alive = 0, total = 0;
const gaps = [];
const lastByConn = new Map();
const errors = [];

function connect(i) {
  const req = http.get({ host: '127.0.0.1', port: PORT, path: PATH }, (res) => {
    if (res.statusCode !== 200) { errors.push(`conn${i}: HTTP ${res.statusCode}`); return; }
    alive++;
    let buf = '';
    res.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
        if (!frame.startsWith('event: birth')) continue;
        total++;
        const now = Date.now();
        const last = lastByConn.get(i);
        if (last) gaps.push(now - last);
        lastByConn.set(i, now);
      }
    });
    res.on('end', () => { alive = Math.max(0, alive - 1); });
    res.on('error', () => { alive = Math.max(0, alive - 1); });
    conns.set(i, { req, res });
  });
  req.on('error', (e) => errors.push(`conn${i}: ${e.code}`));
}
const conns = new Map();
Array.from({ length: N }, (_, i) => connect(i));

setTimeout(() => {
  for (const { req } of conns.values()) req.destroy();
  const dt = (Date.now() - t0) / 1000;
  gaps.sort((a, b) => a - b);
  const q = (p) => (gaps.length ? gaps[Math.floor(gaps.length * p)] : 0);
  console.log(JSON.stringify({
    conns: N, seconds: dt,
    alive_at_end: alive,
    births_total: total,
    per_conn_rate: (total / N / dt).toFixed(3) + '/s',
    gap_ms: { p50: q(0.5), p95: q(0.95), max: gaps.at(-1) ?? 0 },
    errors: errors.length, error_sample: errors.slice(0, 3),
  }, null, 2));
  process.exit(errors.length > 2 || alive < N * 0.9 ? 1 : 0);
}, SECS * 1000);

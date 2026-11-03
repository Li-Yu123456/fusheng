// 浮生全站公告（hub/assets/notice.js）：Shadow DOM 弹角标，不受游戏样式影响；
// 每条公告每台设备弹一次（localStorage 按 id 记忆），过期不弹。
// 世界与主页各引一行 <script src="/nt/notice.js" defer>。
(() => {
  if (window.__fsNotice) return;
  window.__fsNotice = true;

  const SEEN_KEY = 'fusheng.notice.seen';
  function seenIds() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
  }
  function markSeen(id) {
    try {
      const s = [...seenIds(), id];
      localStorage.setItem(SEEN_KEY, JSON.stringify(s.slice(-60)));
    } catch { /* 存不了就每次弹，可接受 */ }
  }

  fetch('/nt/notices.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then(({ items }) => {
      const now = Date.now();
      const seen = seenIds();
      const active = (items || []).filter((n) => n.until > now && !seen.has(n.id));
      if (!active.length) return;
      const n = active[0];

      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:2147483646;max-width:min(340px,86vw);';
      const root = host.attachShadow({ mode: 'closed' });
      root.innerHTML = `
        <style>
          .card {
            background: #f7f2e7; color: #2b2620;
            border: 2px solid #2b2620; border-left: 5px solid #b3542e;
            padding: 14px 16px; font: 14px/1.7 'Noto Serif SC','Songti SC','SimSun',serif;
            box-shadow: 4px 4px 0 rgba(43,38,32,.18);
          }
          @media (prefers-color-scheme: dark) {
            .card { background: #1c1f24; color: #e6dfd2; border-color: #e6dfd2; }
          }
          h4 { margin: 0 0 6px; font-size: 12px; letter-spacing: .3em; opacity: .75; font-weight: 600; }
          p { margin: 0; white-space: pre-wrap; }
          button {
            margin-top: 10px; padding: 4px 14px; font: inherit; font-size: 12px;
            background: none; border: 1px solid currentColor; color: inherit;
            cursor: pointer; letter-spacing: .2em;
          }
          button:hover { background: rgba(179,84,46,.12); }
        </style>
        <div class="card" role="alert">
          <h4>浮生公告</h4>
          <p></p>
          <button type="button">知道了</button>
        </div>`;
      root.querySelector('p').textContent = n.text; // textContent 防注入：公告内容永不解析为 HTML
      root.querySelector('button').addEventListener('click', () => {
        markSeen(n.id);
        host.remove();
      });
      document.body.appendChild(host);
    })
    .catch(() => { /* 公告拉不到就安静：不挡游戏 */ });
})();

// worlds.js —— 拉取 /worlds.json 渲染世界卡
// 为什么硬编码回退：M1 单世界（fusheng）信息在契约里冻结，接口偶发失败也不该让主页空场

const FALLBACK_WORLD = {
  key: 'fusheng',
  name: { zh: '浮生' },
  path: 'worlds/fusheng/', // 相对路径：hub（/）与 Pages（/fusheng/）下都解析正确
  desc: { zh: '按真实统计数据投胎，把这一生过到最后' },
  emoji: '♾️',
};

export function renderWorlds(containerEl) {
  fetch('worlds.json') // 相对：hub 根与 Pages site 根都有 worlds.json
    .then((r) => {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    })
    .then((data) => mount(containerEl, data.worlds || []))
    .catch(() => mount(containerEl, [FALLBACK_WORLD]));
}

function mount(containerEl, worlds) {
  containerEl.textContent = '';
  for (const w of worlds) {
    const a = document.createElement('a');
    a.className = 'world-card';
    a.href = w.path;

    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = w.emoji || '◈';
    emoji.setAttribute('aria-hidden', 'true');

    const body = document.createElement('span');
    body.className = 'wc-body';
    const name = document.createElement('p');
    name.className = 'wc-name';
    name.textContent = (w.name && w.name.zh) || w.key;
    const desc = document.createElement('p');
    desc.className = 'wc-desc';
    desc.textContent = (w.desc && w.desc.zh) || '';
    body.append(name, desc);

    const go = document.createElement('span');
    go.className = 'wc-go';
    go.textContent = '进入 →';

    a.append(emoji, body, go);
    containerEl.appendChild(a);
  }
  if (!worlds.length) {
    const p = document.createElement('p');
    p.className = 'fallback';
    p.textContent = '世界尚未开放。';
    containerEl.appendChild(p);
  }
}

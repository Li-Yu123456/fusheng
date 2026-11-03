// pulse.js —— SSE 新生儿流与在线计数
// 为什么自己维护国名映射而不让 hub 附带：SSE data 格式是冻结契约（CONTRACTS.md §3），
// 主页消费端自行持有 code→中文名，契约数据一字不动。

const COUNTRY_ZH = {
  IND: '印度', CHN: '中国', USA: '美国', IDN: '印度尼西亚', PAK: '巴基斯坦',
  NGA: '尼日利亚', BRA: '巴西', BGD: '孟加拉国', RUS: '俄罗斯', ETH: '埃塞俄比亚',
  MEX: '墨西哥', JPN: '日本', PHL: '菲律宾', EGY: '埃及', COD: '刚果（金）',
  VNM: '越南', IRN: '伊朗', TUR: '土耳其', DEU: '德国', THA: '泰国',
  GBR: '英国', TZA: '坦桑尼亚', FRA: '法国', ZAF: '南非', ITA: '意大利',
  KEN: '肯尼亚', MMR: '缅甸', COL: '哥伦比亚', KOR: '韩国', UGA: '乌干达',
  SDN: '苏丹', DZA: '阿尔及利亚', ESP: '西班牙', ARG: '阿根廷', IRQ: '伊拉克',
  AFG: '阿富汗', CAN: '加拿大', AGO: '安哥拉', POL: '波兰', MAR: '摩洛哥',
  MYS: '马来西亚', GHA: '加纳', PER: '秘鲁', SAU: '沙特阿拉伯', NPL: '尼泊尔',
};

const MAX_ITEMS = 6;

/**
 * 接管新生儿流渲染。
 * @param {HTMLElement} listEl  <ol class="births">
 * @param {HTMLElement} livingEl 在线计数容器
 * @param {HTMLElement} sectionEl <section class="stream">（断线降级用）
 */
export function startPulse(listEl, livingEl, sectionEl) {
  const loading = document.createElement('li');
  loading.className = 'loading';
  loading.textContent = '正在接通星河……';
  listEl.appendChild(loading);

  const setLiving = (n) => {
    livingEl.innerHTML = '此刻，<strong>' + n + '</strong> 个灵魂在此停留';
  };

  const renderLiving = (n) => {
    if (Number.isFinite(n) && n >= 0) setLiving(n);
  };

  // 初始 living 用一次 pulse 拉齐；之后由 SSE 的 stat 事件接力刷新
  fetch('/api/pulse')
    .then((r) => r.json())
    .then((p) => renderLiving(p.living))
    .catch(() => {}); /* 失败不打断首屏：stat 事件很快会补上 */

  const pushBirth = (d) => {
    if (loading.isConnected) loading.remove();
    const country = COUNTRY_ZH[d.country] || d.country;
    const who = d.gender === 'f' ? '女孩' : '男孩';
    const li = document.createElement('li');
    const line = document.createElement('p');
    line.className = 'line';
    line.textContent = '刚刚，一个' + who + '出生在' + country;
    const sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = d.name + ' · ' + d.year;
    li.append(line, sub);
    listEl.prepend(li);
    // 只留最近 6 条：流的语义是"正在发生"，不是历史记录
    while (listEl.children.length > MAX_ITEMS) listEl.lastElementChild.remove();
  };

  // EventSource 断线原生自动重连（服务器 retry: 3000）；这里只做视觉降级标记
  const es = new EventSource('/api/stream?v=' + Date.now());
  es.addEventListener('birth', (e) => {
    sectionEl.classList.remove('offline');
    try {
      pushBirth(JSON.parse(e.data));
    } catch {
      /* 帧残缺直接丢弃，下一帧 232ms 后就来 */
    }
  });
  es.addEventListener('stat', (e) => {
    try {
      renderLiving(JSON.parse(e.data).living);
    } catch {
      /* 同上 */
    }
  });
  es.onopen = () => sectionEl.classList.remove('offline');
  es.onerror = () => sectionEl.classList.add('offline');
}

// 公告：hub 版探测注入（200 才加载 notice.js）；静态版编译期裁掉——零请求零 404
if (!__FS_STATIC__) {
  fetch('/api/pulse').then(function (r) { if (r.ok) { var el = document.createElement('script'); el.src = '/nt/notice.js'; document.head.appendChild(el); } }).catch(function () {});
}

// main.js —— 主页入口：装配世界卡与新生儿流
import './styles.css';
import { renderWorlds } from './worlds.js';
import { startPulse } from './pulse.js';

renderWorlds(document.getElementById('worlds'));

startPulse(
  document.getElementById('births'),
  document.getElementById('living'),
  document.getElementById('stream')
);

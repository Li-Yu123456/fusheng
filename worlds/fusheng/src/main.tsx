// 挂载入口：worker-4 的 UI（App 内部经 ./ui/engine 消费真引擎——接线见 ui/engineAdapter.ts）。
// world.json 懒加载门：数据就绪前 #root 显示 index.html 里的静态占位（不闪烁框架），
// 就绪后一次性挂载——App 内的 simulate 同步调用由此保证安全。
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import { initWorld } from './ui/worldAdapter';
import { initCommunity } from './ui/community';
import './ui/styles.css';

// 为什么不包 StrictMode：DrawingOverlay 的命签定格回调是一次性语义（ref 防重），
// 开发态双挂载会引入无意义的重复动画校验成本；正确性由 vitest 与构建态保证。
initWorld()
  .then(() => {
    // 社区事件热池与数据并行——议事厅颁布过的内容，即刻并入这段人生的事件池
    void initCommunity();
    createRoot(document.getElementById('root')!).render(<App />);
  })
  .catch((err) => {
    // 数据加载失败是世界级故障：把错误显式摆出来，而不是白屏让人猜
    const root = document.getElementById('root');
    if (root) root.innerHTML = '<p style="padding:2rem;font-size:15px">世界数据加载失败，请刷新重试。</p>';
    console.error('[fusheng] world.json 加载失败', err);
  });

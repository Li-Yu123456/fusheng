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

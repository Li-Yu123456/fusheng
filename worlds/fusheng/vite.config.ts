import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 挂在 hub 静态服务的子路径下（上线时切子域只改这里——学 nevatown 的子域预留）
export default defineConfig({
  plugins: [react()],
  base: './', // 相对基准：hub 的 /worlds/fusheng/ 与 Pages 的 /fusheng/ 一份产物通吃
  // 静态托管构建（Pages）：FS_STATIC=1 时编译期裁掉一切后端请求（SSE/公告/议事厅/账号）
  define: { __FS_STATIC__: JSON.stringify(!!process.env.FS_STATIC) },
  build: { sourcemap: true, target: 'es2020' },
});

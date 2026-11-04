import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 挂在 hub 静态服务的子路径下（上线时切子域只改这里——学 nevatown 的子域预留）
export default defineConfig({
  plugins: [react()],
  base: './', // 相对基准：hub 的 /worlds/fusheng/ 与 Pages 的 /fusheng/ 一份产物通吃
  build: { sourcemap: true, target: 'es2020' },
});

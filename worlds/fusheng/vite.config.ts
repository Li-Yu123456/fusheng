import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 挂在 hub 静态服务的子路径下（上线时切子域只改这里——学 nevatown 的子域预留）
export default defineConfig({
  plugins: [react()],
  base: '/worlds/fusheng/',
  build: { sourcemap: true, target: 'es2020' },
});

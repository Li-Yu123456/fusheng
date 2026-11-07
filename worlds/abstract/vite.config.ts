import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __FS_STATIC__: JSON.stringify(!!process.env.FS_STATIC) },
  build: { sourcemap: false, target: 'es2020' },
});

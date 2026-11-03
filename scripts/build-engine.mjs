// 引擎 → hub/vendor/engine.mjs 打包脚本（esbuild，workspace hoist 可达）。
// 为什么 bundle 而不是 tsx 直跑：hub 是零依赖原生 node，不能背 TS 工具链；
// 而试验场必须跑「与玩家完全同一份引擎」，bundle 是唯一不漂移的交付方式。
import { createRequire } from 'node:module';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outdir = path.join(root, 'hub', 'vendor');

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'worlds', 'fusheng', 'src', 'engine', 'bundle.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  minify: true,
  outfile: path.join(outdir, 'engine.mjs'),
  logLevel: 'info',
});
console.log('[build-engine] hub/vendor/engine.mjs 就绪（试验场与玩家同源）');

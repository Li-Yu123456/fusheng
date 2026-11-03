// home/build.mjs —— esbuild bundle + minify → 内联产出单文件 dist/index.html
// 为什么单文件：质量铁律要求主页零外部 JS（字体除外），gzip < 60KB；
// 单请求即开站，也为后续多世界 hub 托管省去路径协商。

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const homeDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(homeDir, 'src');
const distDir = path.join(homeDir, 'dist');

const result = await build({
  entryPoints: [path.join(srcDir, 'main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  outfile: 'main.js',
  legalComments: 'none',
  logLevel: 'info',
});

// bundle 含 main.js 与 main.css 两个产物（css 由 import './styles.css' 引出）
const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = result.outputFiles.find((f) => f.path.endsWith('.css')).text;

const template = await readFile(path.join(srcDir, 'template.html'), 'utf8');
const html = template
  .replace('__CSS__', () => inlineSafe(css))
  .replace('__JS__', () => inlineSafe(js));

await mkdir(distDir, { recursive: true });
const outPath = path.join(distDir, 'index.html');
await writeFile(outPath, html);

// 字节报告：原始 + gzip（质量铁律的口径是不含字体的单 HTML gzip < 60KB）
const raw = Buffer.byteLength(html);
const gz = gzipSync(Buffer.from(html)).length;
console.log(`[home] dist/index.html 原始 ${(raw / 1024).toFixed(1)}KB / gzip ${(gz / 1024).toFixed(1)}KB`);

// 内联安全：产物里出现 </script> / </style> 会提前终止标签，转义后语义不变
function inlineSafe(s) {
  return s.replace(/<\/(script|style)>/gi, '<\\/$1>');
}

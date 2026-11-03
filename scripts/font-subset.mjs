// 字体子集化（text= 参数法，零工具链）——按页面分集：
//   主页：文案少（~300 字），子集有效 → 注入 text=，1 个字体文件
//   世界页：文案 1500+ 字，Google css2 会静默忽略超长 text=（实测 2026-11-02：
//     1564 字符/14KB URL 被回退到完整 unicode-range 分片 CSS）→ 不注入，
//     保留按需分片机制（display=swap 不阻塞 + 宋体 fallback 兜底）
// 科学循环记录：这是「大子集」假设的负结果；世界页若未来要真子集，
// 需自托管 woff2（字体文件进 dist），不在 M2 范围。
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXT_LIMIT = 500; // 保守上限：超此长度 Google 端忽略 text= 的风险高

async function walk(dir, out) {
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    let isDir = false;
    try {
      isDir = (await readdir(p)) !== undefined;
    } catch {
      isDir = false;
    }
    if (isDir) await walk(p, out);
    else if (/\.(tsx?|mjs|css|html|json)$/.test(name) && !p.includes('dist') && !p.includes('node_modules') && !p.includes('cache')) out.push(p);
  }
  return out;
}


async function main() {
  // 主页字符集：主页自身 + hub 的对外文案（人名/国名/公告语）
  const homeFiles = [...(await walk(path.join(ROOT, 'home', 'src'), [])), path.join(ROOT, 'hub', 'server.mjs'), path.join(ROOT, 'hub', 'council.mjs')];
  let homeText = '';
  {
    const chars = new Set();
    for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
    for (const c of '，。、；：？！「」（）《》—…·～％') chars.add(c);
    for (const f of homeFiles) {
      const s = await readFile(f, 'utf-8').catch(() => '');
      for (const ch of s) {
        const code = ch.codePointAt(0);
        if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef)) chars.add(ch);
      }
    }
    homeText = [...chars].join('');
  }

  // 世界页字符集：世界源码 + world.json 国名（判定是否超限）
  const worldFiles = [...(await walk(path.join(ROOT, 'worlds', 'fusheng', 'src'), []))];
  let worldText = '';
  {
    const chars = new Set();
    for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
    for (const c of '，。、；：？！「」『』（）《》—…·～％‰＋－＝≈<>〔〕【】　') chars.add(c);
    for (const f of worldFiles) {
      const s = await readFile(f, 'utf-8').catch(() => '');
      for (const ch of s) {
        const code = ch.codePointAt(0);
        if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f) || (code >= 0xff00 && code <= 0xffef)) chars.add(ch);
      }
    }
    worldText = [...chars].join('');
  }

  const strip = (s) => s.replace(/&text=[^"']*/g, '');

  // 主页：与世界页同一上限判定——两次实测（1564 与 802 字符）Google 均拒绝/忽略，
  // 只有几百字符内的小集才值得注入；超限剥离 text=，保留分片按需
  const homeTpl = path.join(ROOT, 'home', 'src', 'template.html');
  let hs = strip(await readFile(homeTpl, 'utf-8'));
  if (homeText.length <= TEXT_LIMIT) {
    hs = hs.replace(/(family=Noto\+Serif\+SC[^"']*)/g, (m) => m + `&text=${encodeURIComponent(homeText).replace(/'/g, '%27')}`);
    console.log(`主页 template.html ← 子集 ${homeText.length} 字符（有效区间）`);
  } else {
    console.log(`主页文案 ${homeText.length} 字符 > 上限 ${TEXT_LIMIT}：实测 Google 拒绝超长 text=，剥离并保留分片按需`);
  }
  await writeFile(homeTpl, hs, 'utf-8');

  // 世界页：超限则剥离 text=，保留分片按需机制（负结果如实落盘）
  const worldHtml = path.join(ROOT, 'worlds', 'fusheng', 'index.html');
  let ws = strip(await readFile(worldHtml, 'utf-8'));
  if (worldText.length <= TEXT_LIMIT) {
    ws = ws.replace(/(family=Noto\+Serif\+SC[^"']*)/g, (m) => m + `&text=${encodeURIComponent(worldText).replace(/'/g, '%27')}`);
    console.log(`世界页 index.html ← 子集 ${worldText.length} 字符`);
  } else {
    console.log(`世界页文案 ${worldText.length} 字符 > 上限 ${TEXT_LIMIT}：Google 端会静默忽略超长 text=，保留 unicode-range 按需分片（display=swap + 宋体 fallback）——如实记录此负结果`);
  }
  await writeFile(worldHtml, ws, 'utf-8');
}
main();

// 主页构建产物健康检查（源码级陷阱曾漏网：font-subset 改写注释内 URL 破坏 <!-- 闭合，
// 整页被吞成注释 → 纯白。此测试在构建产物上防一切"源码完整但渲染空"的结构性事故）
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../../home/dist/index.html', import.meta.url)), 'utf-8');

describe('主页构建产物结构健康', () => {
  it('HTML 注释配平（<!-- 与 --> 数量相等）', () => {
    expect((html.match(/<!--/g) ?? []).length).toBe((html.match(/-->/g) ?? []).length);
  });

  it('body 核心容器上纸（.page 在 body 内而非被注释吞掉）', () => {
    const body = html.slice(html.indexOf('<body'));
    expect(body).toContain('class="page"');
    expect(body).toContain('id="worlds"');
  });

  it('公告脚本在', () => {
    expect(html).toContain('/nt/notice.js');
  });
});

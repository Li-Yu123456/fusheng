// 事件库聚合与模板类型。
// 模板是内部实现（契约只认 LifeEvent），所以类型定义放这里而不污染 types.ts。
import type { BirthSnapshot } from '../tables';
import type { ChoiceOption, Domain, LifeState } from '../types';
import { CHILDHOOD } from './childhood';
import { EDUCATION } from './education';
import { CAREER } from './career';
import { FAMILY } from './family';
import { HEALTH } from './health';
import { ERA } from './era';

/** 事件条件与选项加权所能看到的全部世界——只读，保证纯函数 */
export interface EventContext {
  state: LifeState;
  snapshot: BirthSnapshot;
  country: string;
  gender: 'm' | 'f';
  birthYear: number;
  year: number; // 当前模拟到的年份
  age: number;
}

/** 选项在引擎代抽时的倾向权重：比如教育高的人更可能选择继续深造 */
export interface ChoiceOptionTemplate extends ChoiceOption {
  weight?: (ctx: EventContext) => number;
  outcome: string; // 选定后追加的叙事（中文）
}

export interface ChoiceTemplate {
  prompt: string;
  options: ChoiceOptionTemplate[];
}

export interface EventTemplate {
  id: string;
  domain: Domain;
  minAge: number;
  maxAge: number;
  weight?: number; // 抽取权重，默认 1
  cond?: (ctx: EventContext) => boolean;
  text: string; // 支持 {name}/{partner}/{child} 插值
  effects?: Partial<LifeState>; // 增量（delta），引擎负责 clamp 0-100
  once?: boolean; // 一生仅一次
  choice?: ChoiceTemplate;
  dataSource?: string; // era 事件必填（铁律：有出处）
}

// 官方基线池（编译期冻结）；社区热上线事件走 setExtraEvents 并入——
// ALL_EVENTS 是「BASE 的可变视图」：setExtraEvents 清空重填，模块外引用自动生效
const BASE: EventTemplate[] = [
  ...CHILDHOOD,
  ...EDUCATION,
  ...CAREER,
  ...FAMILY,
  ...HEALTH,
  ...ERA,
];

let extra: EventTemplate[] = [];
export const ALL_EVENTS: EventTemplate[] = BASE.slice();

function rebuild(): void {
  ALL_EVENTS.length = 0;
  ALL_EVENTS.push(...BASE, ...extra);
}

/** 议事厅热上线：整批替换社区区（幂等、可回滚——试验场跑对照组时用） */
export function setExtraEvents(next: EventTemplate[]): void {
  const seen = new Set(BASE.map((e) => e.id));
  for (const e of next) {
    if (!e.id.startsWith('fs-community-')) throw new Error(`社区事件 id 必须带前缀: ${e.id}`);
    if (seen.has(e.id)) throw new Error(`事件 id 冲突: ${e.id}`);
    seen.add(e.id);
  }
  extra = next;
  rebuild();
}

/** 当前社区区快照（试验场构造「当前池 + 待验提案」的对照组） */
export function getExtraEvents(): EventTemplate[] {
  return extra.slice();
}

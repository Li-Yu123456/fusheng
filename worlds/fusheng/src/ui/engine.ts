// UI 消费引擎的唯一入口——UI 组件一律 `import { simulate } from './engine'`（或 '../ui/engine'）。
// 当前指向 stub adapter；集成阶段 lead 只改 ./engineAdapter.ts 内部（换 import 指向
// ../engine/life.ts 的真实现并在调用点补 world 实参），本文件与全部 UI 代码零改动。
import { simulate } from './engineAdapter';

export { simulate };
export type { LifeInput, LifeResult, LifeEvent, Domain, LifeState, Choice } from '../engine/types';

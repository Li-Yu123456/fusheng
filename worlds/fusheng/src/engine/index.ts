// 引擎门面：契约（CONTRACTS §2）的 consume 端入口——worker-4 只需从这里 import，
// 不必了解内部文件划分（rng/tables/mortality/life 可自由重构而不破坏下游）。
export { simulate } from './life';
export { makeRng } from './rng';
export * from './types';

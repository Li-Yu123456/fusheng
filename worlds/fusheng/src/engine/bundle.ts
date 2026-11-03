// 引擎打包入口：esbuild bundle 成 hub/vendor/engine.mjs——议事厅试验场在服务端
// 真跑同一份引擎（科学审批：改的不是另一个模拟器，就是玩家玩的这个）。
export { simulate } from './life';
export { makeRng } from './rng';
export { ALL_EVENTS, setExtraEvents, getExtraEvents } from './events';
export { validateDraft, normalizeDraft, COMMUNITY_PREFIX } from './community';
export type { CommunityEventDraft } from './community';

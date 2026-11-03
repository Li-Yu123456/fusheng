// ============================================================================
// 集成完成：真引擎薄转发（原 stub 已退役——其修复过的 areas/'all' 判断与密度
// 兜底逻辑已由真引擎的 eligible/两级放宽与抉择临期兜底替代）。
// UI 侧签名保持 (input) => LifeResult，world 实参在此统一补齐；
// effects 语义两侧一致（增量 delta），UI 的 applyEffects 零改动。
// ============================================================================
import { simulate as realSimulate } from '../engine/life';
import type { LifeInput, LifeResult } from '../engine/types';
import { getWorld } from './worldAdapter';

export function simulate(input: LifeInput): LifeResult {
  return realSimulate(input, getWorld());
}

// 引擎类型契约：签名冻结（见 /CONTRACTS.md §2）。实现细节自由，导出不可变。

export interface LifeInput {
  seed: number;
  country: string; // ISO3，如 "CHN"
  birthYear: number; // 1950–2026
  gender: 'm' | 'f';
}

export type Domain = 'childhood' | 'education' | 'career' | 'family' | 'health' | 'era';

export interface LifeState {
  alive: boolean;
  health: number; // 0–100
  education: number; // 0–100（受教育程度积累）
  wealth: number; // 0–100（相对出生国分位）
  happiness: number; // 0–100
}

export interface ChoiceOption {
  label: string;
  effects: Partial<LifeState>;
}

export interface Choice {
  prompt: string;
  options: ChoiceOption[];
}

export interface LifeEvent {
  age: number;
  year: number;
  domain: Domain;
  id: string;
  text: string; // 中文叙事，支持 {name} 插值
  effects?: Partial<LifeState>;
  choice?: Choice;
  dataSource?: string; // 数据出处标记（终局报告引用）
}

export interface DeathSummary {
  deathAge: number;
  cause: string;
  vsLex: {
    born: number; // 出生年
    died: number; // 死亡年
    bornCountryLex: number; // 出生国出生年预期寿命
    pct: number; // 寿命相对均值的百分比（>100 = 超过均值）
  };
  stats: {
    eventsSeen: number;
    choicesMade: number;
    domainsTouched: Domain[];
  };
}

export interface LifeResult {
  input: LifeInput;
  events: LifeEvent[];
  deathAge: number;
  summary: DeathSummary;
}

// world.json 的最小形状（完整 schema 见 CONTRACTS.md §1；字段可缺失，引擎须容忍）
export interface YearRow {
  lex?: number | null;
  childMort?: number | null;
  fertility?: number | null;
  schooling?: number | null;
  gdpPc?: number | null;
}
export interface WorldData {
  meta: { source: string; license: string; fetchedAt: string; tables: Record<string, string> };
  countries: Record<string, { name: { zh: string }; years: Record<string, YearRow> }>;
  /** 真实全球行（OWID Entity='World'）："世界均值"叙事用真数据，非样本平均（M2 补充，可选） */
  world?: { years: Record<string, YearRow> };
}

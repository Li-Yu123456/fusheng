// 抽象宇宙·共享类型
export type Mode = 'life' | 'dict' | 'news' | 'tarot' | 'home';

export interface MemeEntry {
  term: string;
  meaning: string;
  origin: string;
  era: string;
  level: 1 | 2 | 3 | 4 | 5; // 抽象等级
  example: string;
  tags: string[];
}

export interface TarotCard {
  name: string;
  emoji: string;
  upright: string;   // 正位解读
  reversed: string;  // 逆位解读
  category: 'work' | 'love' | 'social' | 'tech' | 'life';
}

export interface NewsItem {
  id: string;
  category: '科技' | '财经' | '社会' | '娱乐' | '体育' | '国际';
  headline: string;
  body: string;
  date: string;
  credibility: number; // 0-100，越低越抽象
}

export interface AbstractLifeEvent {
  age: number;
  text: string;
  type: 'meme' | 'social' | 'tech' | 'random' | 'choice' | 'life';
  effects: Partial<{ abstractPower: number; mentalDamage: number; socialCredit: number; memeIndex: number }>;
  choice?: { prompt: string; options: { label: string; effects: Partial<{ abstractPower: number; mentalDamage: number; socialCredit: number; memeIndex: number }>; outcome: string }[] };
}

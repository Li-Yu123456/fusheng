// 时代分层事件池——「因时因地」的根基。
// 问题：92 个事件几乎全是现代（1750+）语境——投胎到公元前 2100 年却看到「车间评先进」是文化错位。
// 方案：按七个时代各自建池，每个池的事件只在该时代触发，文案彻底属于那个时代。
// 引擎按 birthYear → 当前年份匹配时代 → 从该池抽取。

import type { EventTemplate } from './index';

// ── 时代定义 ──
export const ERAS = [
  { id: 'bronze',    minYear: -2100, maxYear: -1000, label: '青铜时代' },
  { id: 'classical', minYear: -1000, maxYear: 500,    label: '古典时代' },
  { id: 'medieval',  minYear: 500,   maxYear: 1500,   label: '中世纪' },
  { id: 'early_mod', minYear: 1500,  maxYear: 1750,   label: '近代早期' },
  { id: 'industrial',minYear: 1750,  maxYear: 1950,   label: '工业时代' },
  { id: 'modern',    minYear: 1950,  maxYear: 2000,   label: '现代' },
  { id: 'contemp',   minYear: 2000,  maxYear: 2026,   label: '当代' },
] as const;

export type EraId = typeof ERAS[number]['id'];

export function eraOf(year: number): EraId {
  for (const e of ERAS) {
    if (year >= e.minYear && year < e.maxYear) return e.id;
  }
  return year >= 2026 ? 'contemp' : 'bronze';
}

// ── 青铜时代（公元前 2100 - 前 1000）：河流文明/铜器/部落/神庙/口传 ──
const BRONZE: EventTemplate[] = [
  { id: 'br-flood-child', minYear: -2100, maxYear: -1000, domain: 'childhood', minAge: 4, maxAge: 12, text: '河水又泛滥了。大人们连夜把粮食搬到高台上，你在泥浆里抓到一条搁浅的鱼。', effects: { happiness: 3, health: -1 } },
  { id: 'br-temple-work', minYear: -2100, maxYear: -1000, domain: 'career', minAge: 12, maxAge: 50, text: '神庙的墙又高了一层。你背着石块走上斜坡，工头在身后数着每一步。', effects: { health: -4, wealth: 1 } },
  { id: 'br-bronze-cast', minYear: -2100, maxYear: -1000, domain: 'career', minAge: 15, maxAge: 45, text: '铜水倒进模具的那一刻，火星溅了你一脸。这把剑的刃口比你父亲的更亮。', effects: { wealth: 4, health: -2 }, once: true },
  { id: 'br-tribal-war', minYear: -2100, maxYear: -1000, domain: 'era', minAge: 15, maxAge: 50, text: '部落的长老敲响了战鼓。你拿起铜矛，跟在父亲的身后走出了村口。', effects: { health: -8, happiness: -5 }, dataSource: '青铜时代部落冲突（考古证据：创伤骨骼比例高）' },
  { id: 'br-sibling-loss', minYear: -2100, maxYear: -1000, domain: 'family', minAge: 3, maxAge: 15, text: '弟弟发了三天高烧，再也没有醒来。母亲把他的名字刻在了一块碎陶片上。', effects: { happiness: -8 } },
  { id: 'br-oral-tradition', minYear: -2100, maxYear: -1000, domain: 'education', minAge: 8, maxAge: 20, text: '冬夜里围着火堆，族里的老人讲起了先祖怎样渡过大水来到这里。你一字不落地记住了。', effects: { education: 3, happiness: 2 } },
  { id: 'br-drought', minYear: -2100, maxYear: -1000, domain: 'era', minAge: 0, maxAge: 80, text: '雨季没有来。田里的苗枯成了柴，粮仓见了底，人们开始吃草根和树皮。', effects: { health: -10, wealth: -5 }, dataSource: '青铜时代干旱/饥荒（地质沉积层证据）' },
  { id: 'br-first-writing', minYear: -2100, maxYear: -1000, domain: 'education', minAge: 10, maxAge: 30, text: '祭司在泥板上刻下了几个符号——那是你的名字，也是你第一次见到被刻下来的话语。', effects: { education: 5 }, once: true, dataSource: '文字起源（约公元前 3200 年苏美尔/前 1200 年甲骨文）' },
  { id: 'br-herd-life', minYear: -2100, maxYear: -1000, domain: 'career', minAge: 10, maxAge: 60, text: '羊群在山坡上散开，你吹了一声口哨，头羊就带着整群走了回来。', effects: { wealth: 2, happiness: 2 } },
  { id: 'br-spirit-heal', minYear: -2100, maxYear: -1000, domain: 'health', minAge: 0, maxAge: 80, text: '巫师摇着铃在你床边走了一整夜。你说不清是药草还是咒语让你退了烧。', effects: { health: 2 } },
];

// ── 古典时代（公元前 1000 - 公元 500）：帝国/哲学/奴隶制/贸易/战争 ──
const CLASSICAL: EventTemplate[] = [
  { id: 'cl-philosophy', minYear: -1000, maxYear: 500, domain: 'education', minAge: 15, maxAge: 30, text: '集市角落有人在辩论什么是「善」。你站了一下午，忘了吃饭。', effects: { education: 5, happiness: 2 }, once: true, dataSource: '轴心时代思想（公元前 800-200 年，雅斯贝斯）' },
  { id: 'cl-empire-tax', minYear: -1000, maxYear: 500, domain: 'career', minAge: 16, maxAge: 60, text: '税吏把账簿翻得哗哗响，你交完了粮，也交完了去年的欠。', effects: { wealth: -4 } },
  { id: 'cl-gladiator', minYear: -100, maxYear: 500, domain: 'career', minAge: 18, maxAge: 35, text: '竞技场的沙地被血浸成了深褐色。观众的喊声像海浪一样盖过了一切。', effects: { health: -10, wealth: 5, happiness: -5 }, dataSource: '罗马角斗士（公元 1-3 世纪）' },
  { id: 'cl-silk-road', minYear: -130, maxYear: 500, domain: 'career', minAge: 20, maxAge: 50, text: '骆驼商队从东边来了，驮着丝绸和香料。你换到了一小块从未见过的布料。', effects: { wealth: 5, education: 2 }, dataSource: '丝绸之路贸易（公元前 130 年起）' },
  { id: 'cl-plague-antonine', minYear: 100, maxYear: 200, domain: 'era', minAge: 0, maxAge: 80, text: '热病像野火一样蔓延。城里每天抬出去的人比出生的还多。', effects: { health: -8, happiness: -6 }, dataSource: '安东尼瘟疫（165-180 年，可能是天花）' },
  { id: 'cl-slave-market', minYear: -1000, maxYear: 500, domain: 'career', minAge: 10, maxAge: 50, text: '奴隶市场在广场西侧。你从旁边走过，不敢看那些眼睛。', effects: { happiness: -5 }, dataSource: '古典时代奴隶制（普遍制度）' },
  { id: 'cl-aqueduct', minYear: -300, maxYear: 500, domain: 'era', minAge: 0, maxAge: 80, text: '水从山那边的石渠里流进城，清得能看见渠底的青苔。你第一次喝到了不用走十里路去挑的水。', effects: { health: 3, happiness: 3 }, dataSource: '罗马水道（公元前 312 年起）' },
  { id: 'cl-barbarian', minYear: 300, maxYear: 500, domain: 'era', minAge: 0, maxAge: 80, text: '城墙上能看到远处的烟。北方来的人骑着矮马，烧了三个村庄。', effects: { health: -5, wealth: -5, happiness: -8 }, dataSource: '蛮族入侵（376 年起民族大迁徙）' },
  { id: 'cl-olympic', minYear: -800, maxYear: 400, domain: 'family', minAge: 16, maxAge: 35, text: '你赤身跑完了赛程。裁判把橄榄枝放在你头上，整座城在喊你的名字。', effects: { happiness: 8, health: 3 }, once: true, dataSource: '古希腊奥运会（公元前 776 年起）' },
  { id: 'cl-oracle', minYear: -1000, maxYear: 500, domain: 'family', minAge: 15, maxAge: 60, text: '你走了七天去神庙问一件事。祭司的答案像雾一样，你回来的路上一直在想。', effects: { happiness: 2, education: 1 } },
  { id: 'cl-legion', minYear: -100, maxYear: 400, domain: 'career', minAge: 18, maxAge: 45, text: '军团的鹰旗在你头顶展开。你扛着盾牌走了整整一个夏天，脚底磨出了新的茧。', effects: { health: -5, wealth: 4 }, dataSource: '罗马军团制度（公元前 107 年马略改革后）' },
  { id: 'cl-warring-states', minYear: -500, maxYear: -200, domain: 'era', minAge: 10, maxAge: 70, text: '邻国的军队又过境了。田里的庄稼被马蹄踩成了泥，征兵的名册上多了三个名字。', effects: { health: -5, wealth: -6, happiness: -5 }, dataSource: '战国时代（公元前 475-221 年）' },
];

// ── 中世纪（500-1500）：封建/教会/行会/瘟疫/朝圣/十字军 ──
const MEDIEVAL: EventTemplate[] = [
  { id: 'md-plague-black', minYear: 1340, maxYear: 1400, domain: 'era', minAge: 0, maxAge: 80, text: '黑死病来了。城门关了一半，尸体在街上排着队等埋。你家的门上画了一个十字。', effects: { health: -12, happiness: -10 }, dataSource: '黑死病（1347-1351，欧洲人口减 1/3-1/2）' },
  { id: 'md-guild-apprentice', minYear: 1000, maxYear: 1500, domain: 'education', minAge: 12, maxAge: 20, text: '你被送去当学徒，师傅的头一件事是教你磨刀——磨了整整一个月。', effects: { education: 3, wealth: 1 } },
  { id: 'md-cathedral-build', minYear: 1000, maxYear: 1500, domain: 'career', minAge: 16, maxAge: 60, text: '大教堂的拱顶又高了一层。你的祖父砌过它的地基，你的孙子可能看不到它封顶。', effects: { happiness: 3, wealth: 2 } },
  { id: 'md-crusade', minYear: 1090, maxYear: 1300, domain: 'era', minAge: 16, maxAge: 50, text: '教皇说这是神圣的使命。你扛着十字架走了三年，到了一个完全陌生的地方。', effects: { health: -8, wealth: -5, happiness: -3 }, dataSource: '十字军东征（1095-1291）' },
  { id: 'md-monastery', minYear: 500, maxYear: 1500, domain: 'education', minAge: 10, maxAge: 25, text: '修道院的缮写室里，你一笔一划抄完了《诗篇》。蜡烛烧到了底，窗外天快亮了。', effects: { education: 6, health: -2 } },
  { id: 'md-feudal-harvest', minYear: 500, maxYear: 1500, domain: 'career', minAge: 14, maxAge: 60, text: '领主的管家用链条量了你的收成，拿走了三分之一。剩下的够一家人吃到冬天。', effects: { wealth: -2, happiness: -2 } },
  { id: 'md-pilgrimage', minYear: 900, maxYear: 1500, domain: 'family', minAge: 20, maxAge: 60, text: '你走了两个月去圣殿朝圣。鞋子磨穿了两双，但你摸到了那块石头。', effects: { happiness: 6, health: -3 } },
  { id: 'md-fair-trade', minYear: 1000, maxYear: 1500, domain: 'career', minAge: 16, maxAge: 55, text: '集市日到了。从法兰德斯来的布商和从威尼斯来的香料商在同一个广场上讨价还价。', effects: { wealth: 4, education: 2 } },
  { id: 'md-university', minYear: 1080, maxYear: 1500, domain: 'education', minAge: 16, maxAge: 25, text: '你成为了大学的第一批学生——全城的窗户都被你的同学们打破过（他们喝醉了）。', effects: { education: 6, happiness: 3 }, once: true, dataSource: '欧洲大学起源（博洛尼亚 1088、巴黎 1150、牛津 1167）' },
  { id: 'md-mongol-inv', minYear: 1200, maxYear: 1300, domain: 'era', minAge: 0, maxAge: 80, text: '从东方来的骑兵比风还快。整座城在三天之内变成了一片焦土。', effects: { health: -10, wealth: -8, happiness: -10 }, dataSource: '蒙古西征（1219-1242）' },
  { id: 'md-leprosy', minYear: 800, maxYear: 1400, domain: 'health', minAge: 15, maxAge: 60, text: '你的手指开始失去知觉。村口新修的石墙是专门为你建的——隔离区。', effects: { health: -10, happiness: -8 }, dataSource: '麻风病（中世纪欧洲流行，隔离制度）' },
];

// ── 近代早期（1500-1750）：大航海/宗教改革/科学革命/殖民 ──
const EARLY_MODERN: EventTemplate[] = [
  { id: 'em-printing', minYear: 1450, maxYear: 1750, domain: 'education', minAge: 12, maxAge: 30, text: '印刷机吱呀作响，一张纸从机器里滑出来——和昨天那张一模一样，一字不差。', effects: { education: 5 }, once: true, dataSource: '古腾堡印刷术（1450 年代）' },
  { id: 'em-new-world', minYear: 1490, maxYear: 1750, domain: 'career', minAge: 16, maxAge: 45, text: '船在海上走了六周。甲板下面挤满了人，你数着自己还剩多少块干面包。', effects: { health: -5, wealth: 5 }, dataSource: '大航海时代（1492 起）' },
  { id: 'em-reformation', minYear: 1510, maxYear: 1600, domain: 'era', minAge: 10, maxAge: 80, text: '教堂门口贴了一张大字报。从此你再去祷告的时候，仪式变了一半。', effects: { happiness: -2, education: 3 }, dataSource: '宗教改革（1517 马丁·路德）' },
  { id: 'em-telescope', minYear: 1600, maxYear: 1650, domain: 'education', minAge: 16, maxAge: 40, text: '你透过那个筒子看到了木星旁边有四个小点——它们不在任何一本书里。', effects: { education: 6, happiness: 3 }, once: true, dataSource: '伽利略望远镜观测（1610）' },
  { id: 'em-colonial-trade', minYear: 1550, maxYear: 1750, domain: 'career', minAge: 18, maxAge: 50, text: '港口的仓库里堆满了糖、烟草和棉花。每一件货的价钱都以人的自由为底价。', effects: { wealth: 6, happiness: -3 }, dataSource: '三角贸易（16-19 世纪）' },
  { id: 'em-smallpox-nw', minYear: 1500, maxYear: 1750, domain: 'health', minAge: 0, maxAge: 80, text: '从旧大陆来的热病杀死了半个村子。你活了下来，但脸上留了疤。', effects: { health: -8, happiness: -5 }, dataSource: '哥伦布大交换疾病（天花/麻疹/流感）' },
];

export const ERA_EVENTS: Record<EraId, EventTemplate[]> = {
  bronze: BRONZE,
  classical: CLASSICAL,
  medieval: MEDIEVAL,
  early_mod: EARLY_MODERN,
  industrial: [], // 现有事件已覆盖
  modern: [],     // 现有事件已覆盖
  contemp: [],    // 现有事件已覆盖
};

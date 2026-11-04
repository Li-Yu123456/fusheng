// M4 事件扩容插入器：五域各 +6 事件（一次性脚本，插入后各域文件即成品）
import { readFile, writeFile } from 'node:fs/promises';

const BASE = '/Users/putongyonghu/Desktop/AI/fusheng/worlds/fusheng/src/engine/events';

const NEW = {
  'childhood.ts': `
  // ---- M4 扩容：童年的褶皱 ----
  {
    id: 'ch-shadow-play',
    domain: 'childhood',
    minAge: 5,
    maxAge: 12,
    text: '墙上的手影一会儿是狗，一会儿是鹰，你给它们都起了名字。',
    effects: { happiness: 3 },
  },
  {
    id: 'ch-first-friend',
    domain: 'childhood',
    minAge: 5,
    maxAge: 11,
    text: '那个总把弹珠分你一半的孩子，成了你此生第一个朋友。',
    effects: { happiness: 4 },
    once: true,
  },
  {
    id: 'ch-riddle-nights',
    domain: 'childhood',
    minAge: 4,
    maxAge: 10,
    text: '外婆的谜语翻来覆去就那几个，你假装每次都猜不出来。',
    effects: { education: 2, happiness: 2 },
  },
  {
    id: 'ch-pox',
    domain: 'childhood',
    minAge: 3,
    maxAge: 8,
    text: '出疹子的那半个月，指甲被剪得极短，手上套着小手套。',
    effects: { health: -3 },
  },
  {
    id: 'ch-lost-found',
    domain: 'childhood',
    minAge: 4,
    maxAge: 9,
    text: '集市上松开了大人的手。半个村子的人举着火把找你。',
    effects: { happiness: -3 },
    once: true,
  },
  {
    id: 'ch-chores',
    domain: 'childhood',
    minAge: 6,
    maxAge: 12,
    // 低收入家庭的童年更早承担家务与农活——数据直接进条件
    cond: (c) => c.snapshot.gdpPc < 3000,
    text: '挑水的扁担磨红了肩，你在门口数过路过的每一辆牛车。',
    effects: { health: -1, wealth: 1 },
  },
`,
  'education.ts': `
  // ---- M4 扩容：求学的明暗 ----
  {
    id: 'ed-praised',
    domain: 'education',
    minAge: 8,
    maxAge: 16,
    text: '作文被当成范文念了一遍，你把头埋得很低，耳朵却竖得很直。',
    effects: { education: 3, happiness: 2 },
  },
  {
    id: 'ed-deskmate',
    domain: 'education',
    minAge: 8,
    maxAge: 16,
    text: '同桌掰了半块橡皮给你，三八线画了又擦，擦了又画。',
    effects: { happiness: 3 },
  },
  {
    id: 'ed-lamp-nights',
    domain: 'education',
    minAge: 12,
    maxAge: 20,
    text: '一盏灯陪到后半夜，蚊子在灯罩上撞出细小的声响。',
    effects: { education: 3, health: -1 },
  },
  {
    id: 'ed-fail-once',
    domain: 'education',
    minAge: 14,
    maxAge: 20,
    text: '放榜那天没找到自己的名字。回去的路走得很慢。',
    effects: { happiness: -4, education: 1 },
    once: true,
  },
  {
    id: 'ed-aid',
    domain: 'education',
    minAge: 10,
    maxAge: 20,
    // 助学金更常见于低收入地区——不是天赋问题，是资源问题
    cond: (c) => c.snapshot.gdpPc < 4000,
    text: '助学金批下来了，班主任说：钱不多，但你只管往前念。',
    effects: { education: 3, wealth: 3 },
    once: true,
  },
  {
    id: 'ed-self-taught',
    domain: 'education',
    minAge: 16,
    maxAge: 28,
    text: '借来的词典翻到脱页，你用米饭粒把最常查的那几页粘了回去。',
    effects: { education: 4 },
  },
`,
  'career.ts': `
  // ---- M4 扩容：营生的起落 ----
  {
    id: 'ca-first-pay',
    domain: 'career',
    minAge: 16,
    maxAge: 24,
    text: '第一笔工钱数了三遍。一半交了家里，剩下的买了一直想要的那样东西。',
    effects: { wealth: 4, happiness: 3 },
    once: true,
  },
  {
    id: 'ca-layoff',
    domain: 'career',
    minAge: 30,
    maxAge: 55,
    text: '厂门口的公告栏前站了很久，通知上的章比名字还清楚。',
    effects: { wealth: -6, happiness: -4 },
    once: true,
  },
  {
    id: 'ca-craft-name',
    domain: 'career',
    minAge: 30,
    maxAge: 55,
    text: '手艺传出了名，有人慕名而来，站在一旁看你做完最后一步。',
    effects: { wealth: 5, education: 1 },
  },
  {
    id: 'ca-apprentice',
    domain: 'career',
    minAge: 45,
    maxAge: 65,
    text: '带了个徒弟，教到一半才发现，当年师傅叹的气原来是这个意思。',
    effects: { education: 2, happiness: 3 },
  },
  {
    id: 'ca-market-stall',
    domain: 'career',
    minAge: 20,
    maxAge: 50,
    cond: (c) => c.snapshot.gdpPc < 8000,
    text: '下班后再去夜市守两个小时摊，收摊时月亮已经很高。',
    effects: { wealth: 3, health: -2 },
  },
  {
    id: 'ca-promotion',
    domain: 'career',
    minAge: 25,
    maxAge: 50,
    text: '名单公布，你的名字在第一行。那晚回家，脚步比平时轻。',
    effects: { wealth: 5, happiness: 2 },
    once: true,
  },
`,
  'family.ts': `
  // ---- M4 扩容：家事的余温 ----
  {
    id: 'fa-quiet-anniversary',
    domain: 'family',
    minAge: 50,
    maxAge: 75,
    text: '结婚纪念日的晚上，两个人对坐着剥完了一碟花生，谁也没提这事。',
    effects: { happiness: 4 },
  },
  {
    id: 'fa-stray-dog',
    domain: 'family',
    minAge: 18,
    maxAge: 60,
    text: '雨夜里捡回来的小狗，后来成了院子里最凶也最忠的那个。',
    effects: { happiness: 5, wealth: -1 },
    once: true,
  },
  {
    id: 'fa-hospital-night',
    domain: 'family',
    minAge: 40,
    maxAge: 70,
    text: '手术室的灯亮了一整夜，走廊的长椅上坐满了攥着缴费单的人。',
    effects: { health: -2, wealth: -5, happiness: -3 },
    once: true,
  },
  {
    id: 'fa-old-letter',
    domain: 'family',
    minAge: 20,
    maxAge: 60,
    text: '一封家书读了三遍，信纸的折痕处已经磨得发亮。',
    effects: { happiness: 3 },
  },
  {
    id: 'fa-empty-nest',
    domain: 'family',
    minAge: 55,
    maxAge: 75,
    text: '孩子去了远方。那间屋子没动过，书包还挂在门后。',
    effects: { happiness: -3 },
    once: true,
  },
  {
    id: 'fa-big-family-photo',
    domain: 'family',
    minAge: 45,
    maxAge: 80,
    text: '全家人凑齐拍了一张合影，摄影师喊"看这里"，所有人都看向了你。',
    effects: { happiness: 5 },
    once: true,
  },
`,
  'health.ts': `
  // ---- M4 扩容：身体的账本 ----
  {
    id: 'he-vaccine',
    domain: 'health',
    minAge: 0,
    maxAge: 12,
    // 全球扩大免疫规划从 1974 年起铺开——出生年份直接进条件
    cond: (c) => c.birthYear >= 1974,
    text: '村里的赤脚医生来了，针头排在一小盒酒精棉里。哭声此起彼伏，你也在其中。',
    effects: { health: 3 },
    once: true,
  },
  {
    id: 'he-toothache',
    domain: 'health',
    minAge: 30,
    maxAge: 70,
    text: '牙疼不是病。等到拔的时候，半边脸肿得变了形。',
    effects: { health: -2, wealth: -2 },
  },
  {
    id: 'he-morning-walk',
    domain: 'health',
    minAge: 40,
    maxAge: 70,
    text: '清晨的路走了三年，路边的狗都认得你的脚步。',
    effects: { health: 4 },
  },
  {
    id: 'he-pulled-through',
    domain: 'health',
    minAge: 40,
    maxAge: 75,
    text: '一场大病，医生说能挺过来不容易。出院那天的太阳格外白。',
    effects: { health: 5, happiness: 4 },
    once: true,
  },
  {
    id: 'he-reading-glasses',
    domain: 'health',
    minAge: 45,
    maxAge: 70,
    text: '报纸要拿远了才看得清，第一副老花镜配了好半天。',
    effects: { health: -1 },
  },
  {
    id: 'he-chronic-peace',
    domain: 'health',
    minAge: 50,
    maxAge: 85,
    text: '药盒按早中晚分了三格。和身体谈成了和解，日子照过。',
    effects: { health: 2, happiness: 2 },
  },
`,
};

for (const [file, block] of Object.entries(NEW)) {
  const p = `${BASE}/${file}`;
  let s = await readFile(p, 'utf-8');
  const anchor = s.lastIndexOf('];');
  if (anchor < 0) throw new Error(`${file}: 找不到数组收尾`);
  s = s.slice(0, anchor) + block + s.slice(anchor);
  await writeFile(p, s, 'utf-8');
  console.log(`${file} +6 事件`);
}
console.log('共 30 个新事件插入完成');

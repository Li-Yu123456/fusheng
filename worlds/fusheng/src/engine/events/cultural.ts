// 事件本地化：按文化圈分池——事件文案的合理边界是文化而非国境。
// 现有 92 个事件多为东亚语境（粮站/祠堂/煤油灯），投胎到尼日利亚时出现这些是文化错位。
// 本文件为非东亚文化圈提供专属事件池；通用事件（生病/上学/老去等人类共通）保留在原域。
import type { EventTemplate } from './index';
import { cultureOf, type CultureRegion } from '../cultureRegions';

const cultural = (region: CultureRegion): ((c: { country: string }) => boolean) =>
  (c) => cultureOf(c.country) === region;

// ---- 南亚：恒河/种姓/季风/殖民/独立 ----
const SOUTH_ASIA: EventTemplate[] = [
  { id: 'sa-monsoon-child', domain: 'childhood', minAge: 3, maxAge: 10, cond: cultural('south_asia'),
    text: '季风来了，院子里的泥墙喝饱了水，你赤脚踩过的水洼映着乌云。', effects: { happiness: 2 } },
  { id: 'sa-caste-school', domain: 'education', minAge: 6, maxAge: 14, cond: cultural('south_asia'),
    text: '学校的老师从不叫你的全名。你在课本背面用铅笔画了一棵菩提树。', effects: { education: 2, happiness: -1 } },
  { id: 'sa-arranged', domain: 'family', minAge: 18, maxAge: 28, cond: cultural('south_asia'),
    text: '父母安排的婚事，你在婚礼上第一次看清楚对方的长相。', effects: { happiness: -2 },
    choice: { prompt: '接受这段婚姻吗？',
      options: [
        { label: '接受安排', effects: { happiness: 2, wealth: 3 }, outcome: '两个家庭从此绑在了一起。' },
        { label: '拒绝', effects: { happiness: -3, education: 3 }, outcome: '村里人说了很久，你去了城里读书。' },
      ] } },
  { id: 'sa-ghat', domain: 'family', minAge: 40, maxAge: 65, cond: cultural('south_asia'),
    text: '恒河边的火葬台青烟升起，你替家中长辈拾了骨灰。', effects: { happiness: -5 } },
  { id: 'sa-green-rev', domain: 'career', minAge: 20, maxAge: 45, cond: cultural('south_asia'),
    text: '新的稻种让田里翻了一倍的金黄，粮仓第一次装不下。', effects: { wealth: 6 },
    dataSource: 'OWID gdpPc' },
  { id: 'sa-train-city', domain: 'career', minAge: 16, maxAge: 30, cond: cultural('south_asia'),
    text: '挤上了开往孟买或达卡的火车，车顶上坐满了和你一样的人。', effects: { wealth: 4, happiness: -2 } },
];

// ---- 中东/北非：清真寺/斋月/石油/沙漠/古文明 ----
const MIDDLE_EAST: EventTemplate[] = [
  { id: 'me-ramadan-child', domain: 'childhood', minAge: 5, maxAge: 12, cond: cultural('middle_east'),
    text: '斋月的傍晚，整条街的人坐在门口等日头落尽，你会偷偷闻面包的香味。', effects: { happiness: 2 } },
  { id: 'me-quran', domain: 'education', minAge: 5, maxAge: 14, cond: cultural('middle_east'),
    text: '在清真寺的地毯上，你一笔一划学会了第一段经文。', effects: { education: 3 } },
  { id: 'me-oil-boom', domain: 'career', minAge: 20, maxAge: 50, cond: cultural('middle_east'),
    text: '石油的钱像沙漠里的洪水一样涌来，城市的天际线一年换一次轮廓。', effects: { wealth: 8 },
    dataSource: 'OWID gdpPc' },
  { id: 'me-hajj', domain: 'family', minAge: 40, maxAge: 70, cond: cultural('middle_east'),
    text: '你去了麦加。回来之后，邻居开始叫你「哈吉」。', effects: { happiness: 6 } },
  { id: 'me-olive', domain: 'career', minAge: 20, maxAge: 55, cond: cultural('middle_east'),
    text: '橄榄树下，你把手掌贴在祖辈种下的树干上，它比你祖父的祖父还老。', effects: { wealth: 2, happiness: 3 } },
];

// ---- 撒哈拉以南非洲：村庄/鼓声/部落/独立/内战/艾滋病 ----
const SUB_SAHARAN: EventTemplate[] = [
  { id: 'af-drum-child', domain: 'childhood', minAge: 3, maxAge: 10, cond: cultural('sub_saharan'),
    text: '村口的鼓声响了一整夜，长辈们说那是远方来的消息。', effects: { happiness: 2 } },
  { id: 'af-grandmother', domain: 'family', minAge: 0, maxAge: 12, cond: cultural('sub_saharan'),
    text: '祖母在炉火边讲故事，你记住了每一个动物的名字和它们的狡猾。', effects: { happiness: 4, education: 2 } },
  { id: 'af-harvest-rain', domain: 'career', minAge: 16, maxAge: 55, cond: cultural('sub_saharan'),
    text: '雨季迟了两周，你蹲在干裂的田埂上数蚂蚁搬家的方向。', effects: { health: -3, wealth: -4 },
    dataSource: 'OWID child-mortality' },
  { id: 'af-independence', domain: 'era', minAge: 0, maxAge: 80, cond: cultural('sub_saharan'),
    text: '独立的旗帜升起来了。街上的人唱着你听不太懂的国歌，但他们唱得很响。', effects: { happiness: 4 },
    dataSource: '非洲独立浪潮 1957-1975' },
  { id: 'af-aid-crisis', domain: 'health', minAge: 15, maxAge: 50, cond: cultural('sub_saharan'),
    text: '村里陆续有人瘦得脱了形。没人说出那个词，但所有人都知道。', effects: { health: -8, happiness: -6 },
    dataSource: 'HIV/AIDS 蔓延 1985-2005' },
  { id: 'af-market-woman', domain: 'career', minAge: 16, maxAge: 50, cond: cultural('sub_saharan'),
    text: '你顶着盆子去集市卖菜，走十里路不换肩。', effects: { wealth: 3, health: -2 } },
];

// ---- 欧洲：工业革命/世界大战/福利国家/世俗化 ----
const EUROPE: EventTemplate[] = [
  { id: 'eu-industrial', domain: 'era', minAge: 8, maxAge: 60, cond: cultural('europe'),
    text: '工厂的汽笛声取代了教堂的钟声，你从乡下搬进了排屋区。', effects: { wealth: 4, health: -3 },
    dataSource: '工业革命 1780-1880' },
  { id: 'eu-war-ration', domain: 'era', minAge: 0, maxAge: 80, cond: cultural('europe'),
    text: '配给簿上的每一行都被剪掉了一角，你在黑市换过一双袜子。', effects: { happiness: -5, wealth: -4 },
    dataSource: '两次世界大战 1914-1945' },
  { id: 'eu-university', domain: 'education', minAge: 17, maxAge: 24, cond: cultural('europe'),
    text: '免费大学教育的门向你敞开，你是家里第一个走进阶梯教室的人。', effects: { education: 6 } },
  { id: 'eu-welfare', domain: 'health', minAge: 30, maxAge: 70, cond: cultural('europe'),
    text: '国家的医疗卡刷了一下，这一年的诊疗和药没有花一分钱。', effects: { health: 5, wealth: 2 } },
  { id: 'eu-summer-holiday', domain: 'family', minAge: 25, maxAge: 65, cond: cultural('europe'),
    text: '带薪休假的八月，全家去了海边。你在日记里贴了一张明信片。', effects: { happiness: 5 } },
];

// ---- 拉丁美洲：狂欢节/足球/独裁/债务危机/毒品 ----
const LATIN_AMERICA: EventTemplate[] = [
  { id: 'la-carnival', domain: 'childhood', minAge: 5, maxAge: 14, cond: cultural('latin_america'),
    text: '狂欢节的鼓声从天亮响到天黑，你第一次化了脸上的一颗星。', effects: { happiness: 5 } },
  { id: 'la-soccer', domain: 'childhood', minAge: 6, maxAge: 16, cond: cultural('latin_america'),
    text: '赤脚在尘土里踢一团绑紧的报纸，你告诉所有人将来会踢世界杯。', effects: { happiness: 4, health: 2 } },
  { id: 'la-junta', domain: 'era', minAge: 10, maxAge: 70, cond: cultural('latin_america'),
    text: '军队接管了广播电台。邻居家的儿子从此没有人再提起。', effects: { happiness: -8, education: -2 },
    dataSource: '拉美军事独裁 1964-1990' },
  { id: 'la-debt', domain: 'career', minAge: 25, maxAge: 60, cond: cultural('latin_america'),
    text: '货币一夜之间变成了纸，你攒了半辈子的积蓄买不起一袋面粉。', effects: { wealth: -10, happiness: -5 },
    dataSource: '拉美债务危机 1982' },
  { id: 'la-favela', domain: 'career', minAge: 15, maxAge: 40, cond: cultural('latin_america'),
    text: '山坡上的棚户区越搭越高，你从窗口能看见山下富人区的游泳池。', effects: { wealth: -2, happiness: -2 } },
  { id: 'la-migration', domain: 'family', minAge: 18, maxAge: 40, cond: cultural('latin_america'),
    text: '你登上了北去的巴士，母亲塞给你的纸上写着入境后要打的电话号码。', effects: { wealth: 5, happiness: -4 } },
];

export const CULTURAL_EVENTS: EventTemplate[] = [
  ...SOUTH_ASIA, ...MIDDLE_EAST, ...SUB_SAHARAN, ...EUROPE, ...LATIN_AMERICA,
];

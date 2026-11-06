// 地区完整叙事体系——每个文化圈有自己的事件全集，不是一个池加标签。
// 聚焦 1750-2026（有真实分国数据的时段），每条事件写到「只在那个地方那个年代才可能发生」的精度。
// 铁律：每条事件写完问一遍——换个国家换个年代，这段文字还成立吗？成立就删掉重写。
import type { EventTemplate } from './index';
import { cultureOf } from '../cultureRegions';

const is = (r: Parameters<typeof cultureOf>[0]) => (c: { country: string }) => cultureOf(c.country) === r;

// ══════════════════════════════════════════════════════════════════
// 东亚 1750-2026：从天朝上国到殖民→战争→革命→经济起飞→数字化
// ══════════════════════════════════════════════════════════════════
export const EAST_ASIA: EventTemplate[] = [
  // 18-19 世纪：王朝余晖与西方冲击
  { id: 'ea-1', domain: 'childhood', minAge: 5, maxAge: 12, minYear: 1750, maxYear: 1840, cond: is('east_asia'),
    text: '私塾先生的戒尺敲在桌上，你跟着念「人之初性本善」，窗外有卖糖人的吆喝声经过。',
    weight: 3,
    effects: { education: 3 }, once: true },
  { id: 'ea-2', domain: 'family', minAge: 15, maxAge: 25, minYear: 1750, maxYear: 1900, cond: is('east_asia'),
    text: '鸦片烟枪在族叔手中传来传去，客厅里的檀香也盖不住那股甜腻味。',
    weight: 3,
    effects: { happiness: -3, wealth: -2 } },
  { id: 'ea-3', domain: 'era', minAge: 10, maxAge: 70, minYear: 1839, maxYear: 1842, cond: is('east_asia'),
    text: '海面上来了铁壳船。炮声从虎门一路响到了南京，签的那张纸用的是两种文字。',
    weight: 3,
    effects: { happiness: -6 }, once: true, dataSource: '第一次鸦片战争 1839-1842' },
  { id: 'ea-4', domain: 'career', minAge: 16, maxAge: 50, minYear: 1850, maxYear: 1900, cond: is('east_asia'),
    text: '洋行的买办穿着西装从你身边走过，皮鞋踩在青石板上的声音和布鞋完全不同。',
    weight: 3,
    effects: { wealth: 4, education: 2 } },

  // 20 世纪前半：战争与革命
  { id: 'ea-5', domain: 'era', minAge: 8, maxAge: 60, minYear: 1937, maxYear: 1945, cond: is('east_asia'),
    text: '防空警报响了。你夹在人潮里往城墙外跑，手里攥着半块没吃完的饼。',
    weight: 3,
    effects: { health: -5, happiness: -8, wealth: -5 }, once: true, dataSource: '二战/抗战 1937-1945' },
  { id: 'ea-6', domain: 'family', minAge: 15, maxAge: 40, minYear: 1945, maxYear: 1949, cond: is('east_asia'),
    text: '一个决定改变了一切。有人留了下来，有人上了最后一班船。你家的饭桌上从此空了两把椅子。',
    weight: 3,
    effects: { happiness: -10 }, once: true, dataSource: '1949 年大分流' },

  // 20 世纪后半：建设与动荡
  { id: 'ea-7', domain: 'career', minAge: 16, maxAge: 40, minYear: 1958, maxYear: 1961, cond: (c) => c.country === 'CHN',
    text: '公社的食堂散了伙。家里的铁锅交上去炼了钢，你现在用的是瓦罐。',
    weight: 3,
    effects: { health: -8, wealth: -6 }, once: true, dataSource: '三年困难时期 1959-1961' },
  { id: 'ea-8', domain: 'education', minAge: 15, maxAge: 30, minYear: 1966, maxYear: 1976, cond: (c) => c.country === 'CHN',
    text: '课停了。你在墙上刷了大字报，浆糊的味道粘在手上好几天洗不掉。',
    weight: 3,
    effects: { education: -5, happiness: -3 }, once: true, dataSource: '文化大革命 1966-1976' },
  { id: 'ea-9', domain: 'education', minAge: 16, maxAge: 35, minYear: 1977, maxYear: 1979, cond: (c) => c.country === 'CHN',
    text: '广播里说恢复高考了。你在牛棚里翻出压了十年的课本，煤油灯烧到了手指。',
    weight: 3,
    effects: { education: 8, happiness: 5 }, once: true, dataSource: '1977 年恢复高考' },

  // 日本特有
  { id: 'ea-10', domain: 'era', minAge: 0, maxAge: 30, minYear: 1945, maxYear: 1955, cond: (c) => c.country === 'JPN',
    text: '废墟上开始出现新的木屋。美国人的吉普车从街角驶过，车里的口香糖是你在课本上从没见过的东西。',
    weight: 3,
    effects: { happiness: -2, education: 2 }, once: true, dataSource: '日本战后重建/美军占领 1945-1952' },
  { id: 'ea-11', domain: 'career', minAge: 22, maxAge: 50, minYear: 1960, maxYear: 1990, cond: (c) => c.country === 'JPN',
    text: '末班电车上你站着睡着了。到站时领带已经歪到了另一边，这是你连续第三个月加班到十一点。',
    weight: 3,
    effects: { wealth: 6, health: -5 }, dataSource: '日本经济高速增长期（1960-1990）' },

  // 改革开放与经济起飞
  { id: 'ea-12', domain: 'career', minAge: 18, maxAge: 50, minYear: 1984, maxYear: 2000, cond: is('east_asia'),
    text: '个体户的招牌挂上了街。你从国营厂请了长假，在夜市支起了第一个摊位。',
    weight: 3,
    effects: { wealth: 7, happiness: 3 }, once: true, dataSource: '中国城市经济体制改革 1984' },
  { id: 'ea-13', domain: 'career', minAge: 20, maxAge: 45, minYear: 1992, maxYear: 2010, cond: is('east_asia'),
    text: '南下的大巴挤得连车门都关不上。到了深圳，你发现连空气里都是钱的味道。',
    weight: 3,
    effects: { wealth: 8, happiness: -2 }, once: true, dataSource: '1992 年南方谈话后打工潮' },

  // 21 世纪
  { id: 'ea-14', domain: 'family', minAge: 25, maxAge: 50, minYear: 2008, maxYear: 2026, cond: is('east_asia'),
    text: '春节抢票的页面刷新了第两百次。你终于买到一张站票，要在火车上站十八个小时回家。',
    weight: 3,
    effects: { happiness: 3, health: -2 }, dataSource: '春运（世界最大规模人口迁徙）' },
  { id: 'ea-15', domain: 'career', minAge: 22, maxAge: 45, minYear: 2010, maxYear: 2026, cond: is('east_asia'),
    text: '手机上弹出了加班通知。你看了一眼窗外凌晨两点的写字楼，每一层都还亮着灯。',
    weight: 3,
    effects: { wealth: 4, health: -6 }, dataSource: '996 工作制（2010 年代中国互联网行业）' },
];

// ══════════════════════════════════════════════════════════════════
// 欧洲 1750-2026：从旧制度到革命→世界大战→福利国家→一体化
// ══════════════════════════════════════════════════════════════════
export const EUROPE: EventTemplate[] = [
  // 18 世纪末：革命年代
  { id: 'eu-1', domain: 'era', minAge: 10, maxAge: 50, minYear: 1789, maxYear: 1794, cond: is('europe'),
    text: '广场上竖起了断头台。你在人群里听到有人喊「自由、平等、博爱」，声音盖过了教堂的钟。',
    weight: 3,
    effects: { happiness: 4, wealth: -3 }, once: true, dataSource: '法国大革命 1789' },
  { id: 'eu-2', domain: 'career', minAge: 14, maxAge: 40, minYear: 1760, maxYear: 1840, cond: is('europe'),
    text: '蒸汽机的轰鸣日夜不停。你从田里进了厂，手指在纺纱机之间飞快地穿梭。',
    weight: 3,
    effects: { wealth: 3, health: -5 }, dataSource: '工业革命（英国 1760-1840）' },

  // 19 世纪
  { id: 'eu-3', domain: 'education', minAge: 16, maxAge: 25, minYear: 1820, maxYear: 1880, cond: is('europe'),
    text: '你走进了刚建成的大学图书馆。穹顶下的书架比你见过的任何建筑都高，空气里有旧皮革和墨水的味道。',
    weight: 3,
    effects: { education: 6 }, once: true, dataSource: '欧洲大学扩张（19 世纪）' },
  { id: 'eu-4', domain: 'family', minAge: 20, maxAge: 40, minYear: 1850, maxYear: 1900, cond: is('europe'),
    text: '火车开进了你的小镇。这是你第一次见到不需要马拉的车，它喷出的白气吓跑了站台上的鸽子。',
    weight: 3,
    effects: { education: 2, happiness: 3 }, once: true, dataSource: '铁路革命（19 世纪中叶）' },

  // 20 世纪：两次大战
  { id: 'eu-5', domain: 'era', minAge: 16, maxAge: 45, minYear: 1914, maxYear: 1918, cond: is('europe'),
    text: '堑壕里的积水没过了脚踝。你已经在泥里蹲了四个月，对面那个德国人昨天也在喊着想回家。',
    weight: 3,
    effects: { health: -10, happiness: -8 }, once: true, dataSource: '第一次世界大战 1914-1918' },
  { id: 'eu-6', domain: 'era', minAge: 5, maxAge: 60, minYear: 1939, maxYear: 1945, cond: is('europe'),
    text: '轰炸警报在午夜响起。你们挤进地铁站的防空洞，头顶传来玻璃碎裂和砖墙倒塌的声响。',
    weight: 3,
    effects: { health: -8, happiness: -10, wealth: -5 }, once: true, dataSource: '二战欧洲战场/伦敦大轰炸' },
  { id: 'eu-7', domain: 'family', minAge: 10, maxAge: 60, minYear: 1942, maxYear: 1945, cond: is('europe'),
    text: '邻居一家一夜之间消失了。他们家的门上被喷了油漆，后来那套房子一直空着。',
    weight: 3,
    effects: { happiness: -10 }, once: true, dataSource: '大屠杀（1933-1945）' },

  // 战后重建与福利国家
  { id: 'eu-8', domain: 'career', minAge: 20, maxAge: 50, minYear: 1948, maxYear: 1970, cond: is('europe'),
    text: '重建的脚手架爬满了整条街。你用配给券换了第一杯真正的咖啡——战争结束已经三年了。',
    weight: 3,
    effects: { happiness: 5, wealth: 3 }, once: true, dataSource: '马歇尔计划/战后重建 1948' },
  { id: 'eu-9', domain: 'health', minAge: 30, maxAge: 70, minYear: 1950, maxYear: 2026, cond: is('europe'),
    text: '医生的诊室在社区步行五分钟的地方。你刷了一下医保卡，从挂号到取药没有花一分现金。',
    weight: 3,
    effects: { health: 5, wealth: 2 }, dataSource: '国民健康服务体系（英国 NHS 1948 起）' },

  // 冷战与一体化
  { id: 'eu-10', domain: 'era', minAge: 15, maxAge: 70, minYear: 1961, maxYear: 1989, cond: is('europe'),
    text: '一夜之间，一堵墙把街道切成了两半。你表哥住在那边，从此只能隔着铁丝网打招呼。',
    weight: 3,
    effects: { happiness: -8 }, once: true, dataSource: '柏林墙 1961-1989' },
  { id: 'eu-11', domain: 'era', minAge: 10, maxAge: 80, minYear: 1989, maxYear: 1991, cond: is('europe'),
    text: '那堵墙倒了。人们拿着锤子在墙上敲，你捡了一块碎片装进口袋——它现在还放在你的书架上。',
    weight: 3,
    effects: { happiness: 10 }, once: true, dataSource: '柏林墙倒塌 1989 年 11 月 9 日' },
  { id: 'eu-12', domain: 'family', minAge: 20, maxAge: 60, minYear: 1993, maxYear: 2026, cond: is('europe'),
    text: '蓝色的旗帜上升出了十二颗星。你用同一种货币买了面包，过了边境没有出示任何证件。',
    weight: 3,
    effects: { happiness: 4, wealth: 3 }, once: true, dataSource: '欧盟成立 1993/欧元区 1999' },
];

// ══════════════════════════════════════════════════════════════════
// 南亚 1750-2026：从莫卧儿到殖民→独立→分裂→人口爆炸→IT 革命
// ══════════════════════════════════════════════════════════════════
export const SOUTH_ASIA: EventTemplate[] = [
  { id: 'sa-1', domain: 'career', minAge: 16, maxAge: 50, minYear: 1750, maxYear: 1850, cond: is('south_asia'),
    text: '东印度公司的货船又到了。你织的棉布比曼彻斯特的便宜三倍，但税务局把你的织机登记在了别人名下。',
    weight: 3,
    effects: { wealth: -4, happiness: -3 }, dataSource: '英国东印度公司统治（1757-1858）' },
  { id: 'sa-2', domain: 'era', minAge: 10, maxAge: 60, minYear: 1857, maxYear: 1858, cond: is('south_asia'),
    text: '子弹壳上涂了牛油和猪油——这触犯了所有人。兵营里的怒火烧红了整座城市的天空。',
    weight: 3,
    effects: { health: -5, happiness: -5 }, once: true, dataSource: '印度民族起义 1857' },
  { id: 'sa-3', domain: 'family', minAge: 0, maxAge: 80, minYear: 1870, maxYear: 1947, cond: is('south_asia'),
    text: '铁路修到了村里。你的儿子登上了去加尔各答的火车，去给英国人当文书。他寄回来的信上有邮戳和日期。',
    weight: 3,
    effects: { education: 3, happiness: -2 }, once: true, dataSource: '英属印度铁路网（1853-1947）' },
  { id: 'sa-4', domain: 'era', minAge: 10, maxAge: 70, minYear: 1919, maxYear: 1920, cond: is('south_asia'),
    text: '英国兵朝和平请愿的人群开了枪。从那天起，你不再买任何英国货，把进口布扔进了火堆。',
    weight: 3,
    effects: { happiness: -6, education: 3 }, once: true, dataSource: '阿姆利则惨案/不合作运动 1919-1920' },
  { id: 'sa-5', domain: 'era', minAge: 8, maxAge: 70, minYear: 1947, maxYear: 1948, cond: is('south_asia'),
    text: '独立的钟声和分裂的哭声同时响起。你表哥一家在往东走，你在往西走，你们隔着铁轨挥手。',
    weight: 3,
    effects: { happiness: -12 }, once: true, dataSource: '印巴分治 1947（1500 万人迁徙，百万级死亡）' },
  { id: 'sa-6', domain: 'family', minAge: 20, maxAge: 50, minYear: 1975, maxYear: 1977, cond: (c) => c.country === 'IND',
    text: '紧急状态宣布了。你邻居的儿子因为贴了一张海报被带走了，三个月后回来时一句话也不说。',
    weight: 3,
    effects: { happiness: -8 }, once: true, dataSource: '印度紧急状态 1975-1977' },
  { id: 'sa-7', domain: 'career', minAge: 20, maxAge: 45, minYear: 1995, maxYear: 2026, cond: is('south_asia'),
    text: '你敲下了人生第一行代码。班加罗尔办公室的窗外，牛还在路边慢慢走。',
    weight: 3,
    effects: { wealth: 7, education: 5 }, once: true, dataSource: '印度 IT 外包革命（1990 年代起）' },
  { id: 'sa-8', domain: 'family', minAge: 20, maxAge: 40, minYear: 2000, maxYear: 2026, cond: is('south_asia'),
    text: '你去了城里打工，孩子留给爷爷奶奶带。每年只有丰收节能回去一次，视频里孩子已经不认识你了。',
    weight: 3,
    effects: { wealth: 5, happiness: -8 }, dataSource: '南亚农村-城市劳动力迁移' },
];

// ══════════════════════════════════════════════════════════════════
// 撒哈拉以南非洲 1750-2026：从部落到奴隶贸易→殖民→独立→内战→发展
// ══════════════════════════════════════════════════════════════════
export const SUB_SAHARAN: EventTemplate[] = [
  { id: 'af-1', domain: 'era', minAge: 10, maxAge: 50, minYear: 1750, maxYear: 1850, cond: is('sub_saharan'),
    text: '村里少了三个年轻人。他们的脚印在河边消失了，大人们从此不让孩子们单独去水边。',
    weight: 3,
    effects: { happiness: -10 }, once: true, dataSource: '跨大西洋奴隶贸易（16-19 世纪）' },
  { id: 'af-2', domain: 'family', minAge: 8, maxAge: 18, minYear: 1880, maxYear: 1940, cond: is('sub_saharan'),
    text: '传教士建了一所学校。你第一次坐在课桌前，学的第一句外语是「上帝保佑国王」。',
    weight: 3,
    effects: { education: 4, happiness: -1 }, once: true, dataSource: '殖民时期教会学校（1880 年代起）' },
  { id: 'af-3', domain: 'career', minAge: 16, maxAge: 50, minYear: 1890, maxYear: 1950, cond: is('sub_saharan'),
    text: '你的身份证上写着「土著」。进城要通行证，晚上九点以后不能上街，违反了会被抽鞭子。',
    weight: 3,
    effects: { happiness: -8 }, dataSource: '种族隔离/通行证制度（南非 1948-1994 等）' },
  { id: 'af-4', domain: 'era', minAge: 10, maxAge: 70, minYear: 1957, maxYear: 1975, cond: is('sub_saharan'),
    text: '独立的旗帜升起来了。广场上的人唱着你听不太懂的国歌，但每个人都唱得很响。你终于有了自己国家的护照。',
    weight: 3,
    effects: { happiness: 8 }, once: true, dataSource: '非洲独立浪潮（1957 加纳-1975 莫桑比克）' },
  { id: 'af-5', domain: 'era', minAge: 5, maxAge: 60, minYear: 1985, maxYear: 2005, cond: is('sub_saharan'),
    text: '邻居越来越瘦，村里葬礼越来越频繁。没有人说出那个词，但你看见药瓶上写着三个字母。',
    weight: 3,
    effects: { health: -10, happiness: -8 }, once: true, dataSource: 'HIV/AIDS 大流行（1985-2005 撒哈拉以南）' },
  { id: 'af-6', domain: 'era', minAge: 8, maxAge: 60, minYear: 1994, maxYear: 1994, cond: (c) => c.country === 'RWA',
    text: '广播里说「把高的树砍掉」。邻居拿起了砍刀。一百天之后，街上再也没有认识的人了。',
    weight: 3,
    effects: { happiness: -15, health: -5 }, once: true, dataSource: '卢旺达大屠杀 1994（约 80 万人死亡/100 天）' },
  { id: 'af-7', domain: 'family', minAge: 15, maxAge: 40, minYear: 1990, maxYear: 2026, cond: is('sub_saharan'),
    text: '你搭上了往北去的卡车。过了撒哈拉就是利比亚，从那里可以渡海去欧洲。你没告诉母亲你要走多远。',
    weight: 3,
    effects: { wealth: 5, happiness: -10 }, once: true, dataSource: '非洲-欧洲移民路线（地中海）' },
  { id: 'af-8', domain: 'career', minAge: 20, maxAge: 50, minYear: 2000, maxYear: 2026, cond: is('sub_saharan'),
    text: '手机信号塔竖在了村口的山头上。你用手机银行转了第一笔钱给城里的妹妹——不需要银行，不需要现金。',
    weight: 3,
    effects: { wealth: 4, happiness: 3 }, once: true, dataSource: '非洲移动支付革命（M-Pesa 2007 起）' },
];

// ══════════════════════════════════════════════════════════════════
// 拉丁美洲 1750-2026：从殖民到独立→独裁→债务危机→民主化→左转
// ══════════════════════════════════════════════════════════════════
export const LATIN_AMERICA: EventTemplate[] = [
  { id: 'la-1', domain: 'era', minAge: 10, maxAge: 60, minYear: 1810, maxYear: 1830, cond: is('latin_america'),
    text: '广场上有人在宣读独立宣言。西班牙国旗从市政厅的旗杆上被拉了下来，新的旗帜你还是第一次见。',
    weight: 3,
    effects: { happiness: 6 }, once: true, dataSource: '拉丁美洲独立战争（1810-1826）' },
  { id: 'la-2', domain: 'career', minAge: 16, maxAge: 50, minYear: 1880, maxYear: 1930, cond: is('latin_america'),
    text: '咖啡豆的价格涨了三倍。山坡上新开的种植园一望无际，你砍掉了祖辈留下的那片树林。',
    weight: 3,
    effects: { wealth: 6, happiness: -3 }, dataSource: '初级产品出口繁荣（1880-1930）' },
  { id: 'la-3', domain: 'childhood', minAge: 5, maxAge: 15, minYear: 1930, maxYear: 2026, cond: is('latin_america'),
    text: '赤脚在尘土里踢一团绑紧的报纸。你告诉所有人，将来你会穿着十号球衣站在马拉卡纳。',
    weight: 3,
    effects: { happiness: 5, health: 2 }, once: true },
  { id: 'la-4', domain: 'era', minAge: 15, maxAge: 60, minYear: 1964, maxYear: 1985, cond: is('latin_america'),
    text: '军队接管了广播电台。你邻居家的大门凌晨被踢开，从此再也没有人提起他的名字。',
    weight: 3,
    effects: { happiness: -12 }, once: true, dataSource: '拉美军事独裁（1964 巴西/1973 智利/1976 阿根廷）' },
  { id: 'la-5', domain: 'career', minAge: 25, maxAge: 60, minYear: 1982, maxYear: 1985, cond: is('latin_america'),
    text: '货币一夜之间变成了纸。你攒了半辈子的积蓄买不起一袋面粉，银行门口的队伍绕了三个街区。',
    weight: 3,
    effects: { wealth: -12, happiness: -8 }, once: true, dataSource: '拉美债务危机 1982（「失去的十年」）' },
  { id: 'la-6', domain: 'family', minAge: 18, maxAge: 40, minYear: 1990, maxYear: 2026, cond: is('latin_america'),
    text: '你登上了北去的巴士。母亲塞给你的纸上写着入境后要打的电话号码，她的手在发抖。',
    weight: 3,
    effects: { wealth: 5, happiness: -8 }, once: true, dataSource: '拉美-北美移民潮' },
  { id: 'la-7', domain: 'era', minAge: 10, maxAge: 70, minYear: 2002, maxYear: 2015, cond: is('latin_america'),
    text: '左派政府建了新的学校和医院。你家门口的土路铺上了水泥，第一次有了路灯。',
    weight: 3,
    effects: { happiness: 5, wealth: 3 }, once: true, dataSource: '拉美粉红浪潮（1998-2015）' },
];

// ══════════════════════════════════════════════════════════════════
// 中东/北非 1750-2026：从帝国到殖民→石油→战争→阿拉伯之春
// ══════════════════════════════════════════════════════════════════
export const MIDDLE_EAST: EventTemplate[] = [
  { id: 'me-1', domain: 'career', minAge: 16, maxAge: 50, minYear: 1750, maxYear: 1918, cond: is('middle_east'),
    text: '驼铃声从沙漠深处传来。商队驮着丝绸、香料和故事，在你的绿洲歇脚一晚，天亮又消失在沙丘之间。',
    weight: 3,
    effects: { wealth: 3, education: 2 }, once: true, dataSource: '沙漠商队贸易（延续至 20 世纪初）' },
  { id: 'me-2', domain: 'era', minAge: 10, maxAge: 60, minYear: 1916, maxYear: 1922, cond: is('middle_east'),
    text: '奥斯曼帝国在四百年后第一次碎了。欧洲人拿铅笔在地图上画了几条线，从此你的族人和表亲分在了三个国家。',
    weight: 3,
    effects: { happiness: -6 }, once: true, dataSource: '赛克斯-皮科协定 1916/奥斯曼解体 1922' },
  { id: 'me-3', domain: 'career', minAge: 20, maxAge: 55, minYear: 1950, maxYear: 1980, cond: is('middle_east'),
    text: '石油的钱像沙漠洪水一样涌来。你祖父的泥屋推倒了，原址上竖起了一座玻璃幕墙的商场。',
    weight: 3,
    effects: { wealth: 10, happiness: -2 }, once: true, dataSource: '石油繁荣（1973 油价暴涨后）' },
  { id: 'me-4', domain: 'family', minAge: 20, maxAge: 60, minYear: 1948, maxYear: 2026, cond: is('middle_east'),
    text: '房子钥匙还在你口袋里，但门已经不在原来的街上了。你家祖宅的钥匙传了三代人，每一代都回不去。',
    weight: 3,
    effects: { happiness: -12 }, once: true, dataSource: '巴以冲突/中东难民问题（1948 起）' },
  { id: 'me-5', domain: 'era', minAge: 15, maxAge: 60, minYear: 2010, maxYear: 2012, cond: is('middle_east'),
    text: '广场上的人越聚越多。年轻人举着手机，上面显示的不是新闻，是他们自己拍的视频。',
    weight: 3,
    effects: { happiness: 5 }, once: true, dataSource: '阿拉伯之春 2010-2012' },
  { id: 'me-6', domain: 'era', minAge: 5, maxAge: 60, minYear: 2011, maxYear: 2026, cond: (c) => ['SYR', 'IRQ', 'YEM', 'LBY'].includes(c.country),
    text: '炮弹落在了街角的学校。你们连夜收拾了三样东西——水、面粉和一包照片——从此再没有回过那个家。',
    weight: 3,
    effects: { health: -10, wealth: -10, happiness: -15 }, once: true, dataSource: '叙利亚内战 2011-/伊拉克战争/也门内战' },
];

export const REGIONAL_EVENTS: EventTemplate[] = [
  ...EAST_ASIA, ...EUROPE, ...SOUTH_ASIA, ...SUB_SAHARAN, ...LATIN_AMERICA, ...MIDDLE_EAST,
];

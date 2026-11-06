// 中国事件全集（1990-2026）
// 每一条写完问自己：这个人在这个年份这个国家，他的世界里有什么？没有什么？
// 文案标准见 WRITING_GUIDE.md——用完整句子讲故事，不用碎片列表；有画面，有温度，有留白。
// 因果链：童年家境→教育机会→职业选择→家庭结构→健康状况→死亡方式，每一步都有前因后果。

import type { EventTemplate } from './index';

const CHN = (c: { country: string }) => c.country === 'CHN';
const CHN_RURAL = (c: { country: string; snapshot: { gdpPc: number } }) =>
  c.country === 'CHN' && c.snapshot.gdpPc < 3000;
const CHN_F = (c: { country: string; gender: string }) => c.country === 'CHN' && c.gender === 'f';

export const CHINA: EventTemplate[] = [

  // ══════════════════════════════════════════════════════════
  // 童年（0-12 岁）：家境、兄弟姐妹、电视、学校
  // ══════════════════════════════════════════════════════════

  { id: 'cn-c-birth-cert', domain: 'childhood', minAge: 0, maxAge: 3, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '你出生那年，父亲在产房外面蹲了整整一夜。护士出来喊「母子平安」的时候，他站起来，膝盖咔嗒响了一声——蹲太久了。',
    effects: { happiness: 5 }, weight: 2, once: true },

  { id: 'cn-c-only-child', domain: 'childhood', minAge: 3, maxAge: 10, minYear: 1990, maxYear: 2015, cond: CHN,
    text: '你是家里唯一的孩子。六个大人围着你转——爷爷奶奶、外公外婆、爸爸妈妈。吃饭的时候，鸡腿永远在你碗里。你不知道什么叫「让」。',
    effects: { happiness: 3, education: 2 }, weight: 3, once: true,
    dataSource: '独生子女政策（1980-2015）' },

  { id: 'cn-c-black_cat', domain: 'childhood', minAge: 4, maxAge: 10, minYear: 1990, maxYear: 2005, cond: CHN,
    text: '下午六点，你准时守在电视机前。片头曲一响——「啊哈哈……黑猫警长！」——你跟着唱，声音比电视还大。母亲在厨房喊你吃饭，你说等一下，这一等等到了天黑。',
    effects: { happiness: 4 }, weight: 2, once: true,
    dataSource: '《黑猫警长》1984 年首播，90 年代重播高峰' },

  { id: 'cn-c-xiaobawang', domain: 'childhood', minAge: 6, maxAge: 14, minYear: 1995, maxYear: 2010, cond: CHN,
    text: '期末考了全班前五，父亲兑现了承诺——一台小霸王学习机。说是用来学打字的，但你插上卡带的那一刻，「学习」两个字就变成了「魂斗罗」。',
    effects: { happiness: 6, education: -1 }, weight: 3, once: true },

  { id: 'cn-c-laidoff-parent', domain: 'childhood', minAge: 6, maxAge: 14, minYear: 1994, maxYear: 2002, cond: CHN,
    text: '那天下学回家，你发现父亲没有去上班。他坐在沙发上，面前的烟灰缸已经满了。母亲在厨房做饭，油锅的声音比平时响。后来你才知道，「下岗」这两个字是什么意思——它意味着你最喜欢的那个铁皮铅笔盒，以后不会再有新的了。',
    effects: { wealth: -8, happiness: -6 }, weight: 4, once: true,
    dataSource: '国企改革下岗潮（1994-2002，约 3000 万工人下岗）' },

  { id: 'cn-c-rural-left-behind', domain: 'childhood', minAge: 5, maxAge: 14, minYear: 1995, maxYear: 2020, cond: CHN_RURAL,
    text: '父母又走了。你站在村口，看着那趟开往广东的大巴慢慢变成一个黑点。奶奶牵着你的手，手掌糙得像树皮。她已经七十岁了，要种地、做饭、送你上学。你想哭，但她比你先哭了。',
    effects: { happiness: -10, education: -2 }, weight: 4, once: true,
    dataSource: '留守儿童（2000 年代高峰期约 6100 万人）' },

  { id: 'cn-c-urban-cram', domain: 'childhood', minAge: 6, maxAge: 12, minYear: 2000, maxYear: 2021, cond: CHN,
    text: '星期六早上七点，你已经坐在奥数班的教室里了。窗外有人在放风筝，你盯着那根线看了很久。母亲说，隔壁小明已经学到初中内容了，你不能输在起跑线上。你不知道起跑线在哪里，但你知道风筝在天上飞。',
    effects: { education: 5, happiness: -5 }, weight: 3,
    dataSource: '课外辅导班热潮（2000-2021，双减前）' },

  { id: 'cn-c-shuangjian', domain: 'childhood', minAge: 6, maxAge: 14, minYear: 2021, maxYear: 2026, cond: CHN,
    text: '政策一夜之间变了——补习班全关门了。星期六你第一次睡到了自然醒，醒来之后不知道该干什么。母亲站在门口，手里的书包还没放下。她说：「那……我们去公园吧。」你已经三年没去过了。',
    effects: { happiness: 8, education: -2 }, weight: 4, once: true,
    dataSource: '双减政策 2021 年 7 月' },

  // ══════════════════════════════════════════════════════════
  // 求学（12-25 岁）：中考、高考、大学、留学
  // ══════════════════════════════════════════════════════════

  { id: 'cn-e-zhongkao', domain: 'education', minAge: 15, maxAge: 16, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '中考前的那一百天，教室后面的倒计时牌每天翻一页。你从「100」看到「10」再看到「1」，好像在看着什么东西一点一点用完。班主任说：「一分压千人。」你信了。',
    effects: { education: 5, health: -3 }, weight: 3, once: true },

  { id: 'cn-e-gaokao-996', domain: 'education', minAge: 18, maxAge: 19, minYear: 1999, maxYear: 2026, cond: CHN,
    text: '高考前一天晚上，你翻来覆去睡不着。母亲端了一杯热牛奶进来，放在你床头柜上，什么也没说就出去了。你听见她在客厅跟父亲小声说：「别给孩子太大压力。」父亲嗯了一声。牛奶你喝完了，杯底还留着一圈没化开的糖。',
    effects: { education: 6, happiness: -2 }, weight: 3, once: true,
    choice: {
      prompt: '成绩出来了，你的分数比一本线高出二十三分。怎么填志愿？',
      options: [
        { label: '报师范，学费低，毕业有编制',
          effects: { wealth: 3, education: 4, happiness: 2 },
          outcome: '你选了师范。四年之后，你站在讲台上，成了别人家孩子的班主任。工资不高，但旱涝保收，你父母逢人就说「我家孩子是老师」。',
        },
        { label: '报计算机，听说好找工作',
          effects: { wealth: 5, education: 5, health: -3 },
          outcome: '你选了计算机。四年之后，你坐在写字楼的格子间里，凌晨两点的灯还亮着——你自己的和对面楼的都亮着。',
        },
        { label: '报中文系，你喜欢文学',
          effects: { education: 6, happiness: 4, wealth: -2 },
          outcome: '你选了中文系。四年里你读了三百本书，毕业时发现工作不好找，但你从来没有后悔过——你在图书馆的那个下午，阳光从窗户斜进来，你读到了一句诗，突然明白了什么叫「人生天地间，忽如远行客」。',
        },
      ],
    } },

  { id: 'cn-e-gaokao-fail', domain: 'education', minAge: 18, maxAge: 19, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '成绩出来了，你比预估的少了四十分。你盯着屏幕上的数字看了很久，然后关掉了页面。父亲在客厅抽了一支烟，进来说：「要不……复读吧。」你没有抬头。',
    effects: { education: -3, happiness: -8 }, weight: 2, once: true,
    choice: {
      prompt: '要不要复读一年？',
      options: [
        { label: '复读，明年再战',
          effects: { education: 6, happiness: -5, health: -3 },
          outcome: '你又读了一年高三。那年冬天你的头发掉了不少，但第二年的分数比第一年高了五十一分。你选了一个不远不近的城市，去了。',
        },
        { label: '不复读了，走专科也行',
          effects: { education: 2, wealth: 2 },
          outcome: '你去了一所大专，学了一门手艺。毕业之后你在工厂做技术员，手上的茧比大学同学的书卷气实在。',
        },
        { label: '直接打工去',
          effects: { wealth: 4, education: -4, happiness: -3 },
          outcome: '你跟同乡去了东莞。流水线上的日子像一个模子——每天十万件产品从你手边经过，没有一件是你的。',
        },
      ],
    } },

  { id: 'cn-e-daxue-zhao', domain: 'education', minAge: 18, maxAge: 23, minYear: 1999, maxYear: 2026, cond: CHN,
    text: '大学扩招了。你拿着录取通知书走进校门的时候，发现同班同学比你父亲那辈读大学的多了十倍。你不知道这是好事还是坏事——你只知道学费一年比一年贵，而毕业之后的「分配」两个字已经没有人提了。',
    effects: { education: 5, wealth: -3 }, weight: 3, once: true,
    dataSource: '中国高校扩招（1999 年起，招生数从 108 万→2024 年 1076 万）' },

  { id: 'cn-e-overseas', domain: 'education', minAge: 20, maxAge: 26, minYear: 2005, maxYear: 2026,
    cond: (c) => CHN(c) && c.snapshot.gdpPc > 6000,
    text: '你考了雅思，申了澳洲的研究生。飞机降落墨尔本的那个下午，天很蓝，蓝得不像真的。你在微信上给母亲发了一张照片，她回了一个笑脸——你已经教了她很多次怎么发表情。',
    effects: { education: 6, wealth: -8 }, weight: 2, once: true,
    dataSource: '中国留学生热潮（2000 年代起）' },

  { id: 'cn-e-girl-school', domain: 'education', minAge: 12, maxAge: 18, minYear: 1990, maxYear: 2010, cond: CHN_F,
    text: '村里人说，女孩子读那么多书干什么，迟早要嫁人的。你父亲蹲在门口抽了一支烟，站起来说：「让她读。」那两个字你记了一辈子。',
    effects: { education: 6, happiness: 3 }, weight: 3, once: true },

  // ══════════════════════════════════════════════════════════
  // 营生（18-65 岁）：打工、创业、下海、体制内外
  // ══════════════════════════════════════════════════════════

  { id: 'cn-j-nanxia', domain: 'career', minAge: 18, maxAge: 35, minYear: 1992, maxYear: 2000, cond: CHN,
    text: '广播里说「改革开放的胆子要再大一点」。你揣着三百块钱和一张身份证，挤上了南下的大巴。到了深圳，你发现连空气都是热的，热得像蒸笼，里面蒸的是人的野心。你在工地搬了三个月砖，然后进了电子厂。流水线上的日子像一个没有尽头的隧道，但每个月发工资的那天，你在邮局排队寄钱回家，队伍里全是和你一样的人。',
    effects: { wealth: 8, health: -5, happiness: -3 }, weight: 4, once: true,
    dataSource: '1992 年邓小平南方谈话→民工潮' },

  { id: 'cn-j-xiahai', domain: 'career', minAge: 25, maxAge: 45, minYear: 1992, maxYear: 2005, cond: CHN,
    text: '你从单位辞了职——那时候还没有「辞职」这个词，大家管这个叫「下海」。你的同事说你疯了，铁饭碗都不要了。你借了两万块钱，在夜市支了个摊位。第一年亏了，第二年赚了，第三年你在同一个夜市租了三个摊位。到第五年，你在城里买了房。当年说你疯的那个同事，后来来找你，问你还需不需要人手。',
    effects: { wealth: 12, happiness: 3 }, weight: 3, once: true },

  { id: 'cn-j-wto-factory', domain: 'career', minAge: 20, maxAge: 50, minYear: 2001, maxYear: 2012, cond: CHN,
    text: '入世之后，订单像雪片一样飞进来。你所在的纺织厂从一百人扩到了一千人，车间三班倒，机器二十四小时不停。你负责的那台机器比你年纪还大，但它没有坏过——你说这是老机器有良心。加班费第一次超过了基本工资，你给自己买了一个诺基亚。',
    effects: { wealth: 8, health: -4 }, weight: 3,
    dataSource: '中国 2001 年 12 月加入 WTO→「世界工厂」时代' },

  { id: 'cn-j-civil-service', domain: 'career', minAge: 22, maxAge: 35, minYear: 1995, maxYear: 2026, cond: CHN,
    text: '你考上了公务员。笔试第三，面试第一，总分第二——录取两个人。上班第一天，你穿着白衬衫黑裤子，提前半小时到了办公室。科长看了你一眼，说：「小张，帮我把那份文件复印一下。」你说好。这一声「好」，你说了十五年。',
    effects: { wealth: 4, happiness: 2, education: 3 }, weight: 2, once: true },

  { id: 'cn-j-996', domain: 'career', minAge: 24, maxAge: 45, minYear: 2015, maxYear: 2026, cond: CHN,
    text: '你拿到了大厂的offer，年薪四十万。入职第一天HR发了工牌、电脑和一条毛毯——毛毯是加班到凌晨用的。三个月之后你发现，年薪四十万的前提是每天在办公室待十二个小时。你把毛毯铺在了工位下面的行军床上。母亲打电话问你吃得好不好，你说好。',
    effects: { wealth: 10, health: -8, happiness: -5 }, weight: 3,
    dataSource: '996 工作制（2010 年代中国互联网行业，早 9 到晚 9 每周 6 天）' },

  { id: 'cn-j-fangdai', domain: 'career', minAge: 28, maxAge: 40, minYear: 2005, maxYear: 2026, cond: CHN,
    text: '你签了购房合同，首付掏空了你和两边父母三个家庭的积蓄。月供八千五，三十年。你在合同上按手印的时候，指纹印是红色的，像一枚小小的印章。房产中介说「恭喜你」，但你在那间还散发着油漆味的毛坯房里站了很久，觉得它既是你的，也不是你的。',
    effects: { wealth: -10, happiness: -3 }, weight: 3, once: true,
    dataSource: '中国房价（2005 后一线城市房价收入比 >20:1）' },

  { id: 'cn-j-tangping', domain: 'career', minAge: 25, maxAge: 40, minYear: 2021, maxYear: 2026, cond: CHN,
    text: '你从大厂辞了职。不是被裁的，是自己走的。你在出租屋里躺了一个月，手机静音，不看微信。后来你去了一家小公司，工资降了一半，但六点下班。你走出门的时候天还是亮的。你抬头看了看——原来六点的天是这个颜色。',
    effects: { wealth: -5, happiness: 8, health: 5 }, weight: 3, once: true,
    dataSource: '躺平/离职潮（2021 年起）' },

  { id: 'cn-j-girl-factory', domain: 'career', minAge: 16, maxAge: 30, minYear: 1990, maxYear: 2010, cond: CHN_F,
    text: '你十八岁进了电子厂，站在流水线旁边给主板焊接元件。焊锡的味道呛得眼睛疼，但你很快就习惯了。发工资那天你去镇上买了一条裙子——粉红色的，是你自己挣的第一件「好看但不实用」的东西。你把裙子叠好放在枕头下面，怕宿舍的人弄脏了。',
    effects: { wealth: 5, health: -4, happiness: 3 }, weight: 3, once: true },

  // ══════════════════════════════════════════════════════════
  // 家事（20-70 岁）：恋爱、结婚、生子、养老
  // ══════════════════════════════════════════════════════════

  { id: 'cn-f-xiangqin', domain: 'family', minAge: 22, maxAge: 32, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '母亲安排了相亲。你坐在茶馆里，对面那个人你从来没有见过，但你们的人生已经被两家人计算过了：他的工资、你的学历、他家的房子、你家的户口。你喝茶，他也喝茶。你们聊了四十分钟，说了三件事：在哪里工作、有没有房、父母做什么。走的时候他说「加个微信吧」，你说好。',
    effects: { happiness: -2 }, weight: 2 },

  { id: 'cn-f-marry', domain: 'family', minAge: 24, maxAge: 35, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '结婚那天，你穿了一件红色的礼服。鞭炮从村口一路响到家门口，红色的纸屑落了一地，像一层薄薄的雪。你的表哥喝多了，抱着你父亲哭，说「妹妹嫁出去了」。你父亲拍着他的背，自己的眼眶也红了。你站在门口看着这一切，突然觉得——原来结婚不是两个人的事，是两个家族的事。',
    effects: { happiness: 8, wealth: -5 }, weight: 3, once: true },

  { id: 'cn-f-child', domain: 'family', minAge: 25, maxAge: 38, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '孩子出生了。你抱着那个皱巴巴的小东西，她突然睁开眼睛看了你一眼——就那一眼，你突然明白了一件事：从今以后，你不再是为自己活的了。',
    effects: { happiness: 10, wealth: -4 }, weight: 4, once: true },

  { id: 'cn-f-ertong', domain: 'family', minAge: 35, maxAge: 45, minYear: 2016, maxYear: 2026, cond: CHN,
    text: '二孩政策放开了。你和爱人商量了一晚上——养一个孩子已经够累了，要不要再生一个？你看着大孩子的背影，他已经七岁了，背着书包走进学校，背影比你记忆中小了很多。你说：「再生一个吧，让他有个伴。」',
    effects: { happiness: 5, wealth: -6 }, weight: 2, once: true,
    dataSource: '全面二孩政策 2016 年 1 月' },

  { id: 'cn-f-parents-old', domain: 'family', minAge: 45, maxAge: 60, minYear: 2010, maxYear: 2026, cond: CHN,
    text: '父亲的背驼了。上楼梯的时候，他扶着栏杆，一步一步慢慢走，走三步歇一步。你跟在后面，也放慢了脚步。你突然想起小时候，他把你的手放在他的掌心里，一步一步教你走路。那时候他的手掌很大，很暖，你觉得天塌下来也不怕。现在他的手掌还是很大，但骨头凸出来了，皮肤松了。',
    effects: { happiness: -5 }, weight: 3, once: true },

  { id: 'cn-f-mother-pass', domain: 'family', minAge: 50, maxAge: 70, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '母亲走了。她走的那天早上，你还在给她熬粥。护士出来叫你进去的时候，粥还是热的。你端着那碗粥站在走廊里，站了很久。后来粥凉了，你把它倒掉了。那是你最后一次给她熬粥。',
    effects: { happiness: -15 }, weight: 4, once: true },

  // ══════════════════════════════════════════════════════════
  // 身体（30-90 岁）：体检、慢性病、老去
  // ══════════════════════════════════════════════════════════

  { id: 'cn-h-tijian', domain: 'health', minAge: 35, maxAge: 55, minYear: 2005, maxYear: 2026, cond: CHN,
    text: '体检报告出来了。你翻开第一页，看到三个箭头——两个向上一个向下。医生说：「脂肪肝、血压偏高、颈椎退行性改变。」你问严重吗，医生说不严重，少熬夜、多运动。你笑了笑。你知道你做不到。',
    effects: { health: -5 }, weight: 3 },

  { id: 'cn-h-yaomai', domain: 'health', minAge: 28, maxAge: 40, minYear: 2015, maxYear: 2026, cond: CHN,
    text: '你的腰椎已经不行了。每天坐十个小时，腰像被一根钢筋从中间穿过。你去推拿，师傅按到一个位置的时候你叫出了声。他说：「小伙子，你这不是一天两天了。」你说是。他说：「你这也不是一天两天能好的。」',
    effects: { health: -6 }, weight: 3,
    dataSource: '办公室职业病（2010 年代起）' },

  { id: 'cn-h-old-strong', domain: 'health', minAge: 65, maxAge: 85, minYear: 1990, maxYear: 2026, cond: CHN,
    text: '你已经七十多岁了，但每天早上还是五点半起床。你去公园打太极，然后去菜市场买菜，回来给自己和老伴做早饭。你的腿脚还行，就是耳朵有点背了——别人叫你，你得侧过头才能听清。你说这叫「老了」，但你说这话的时候在笑。',
    effects: { health: 4, happiness: 5 }, weight: 2 },

  // ══════════════════════════════════════════════════════════
  // 时代大事（全年龄段）：影响所有人
  // ══════════════════════════════════════════════════════════

  { id: 'cn-t-sars', domain: 'era', minAge: 5, maxAge: 80, minYear: 2003, maxYear: 2003, cond: CHN,
    text: '那年春天，街上的人都戴上了口罩。学校停课了，你在家待了整整两个月。电视里每天播报新增病例，你看着那个数字，第一次觉得死亡离你这么近。后来疫情过去了，你在街上看到不戴口罩的人，觉得有点不习惯。',
    effects: { health: -3, happiness: -5 }, weight: 4, once: true,
    dataSource: 'SARS 疫情 2002 年 11 月-2003 年 7 月（中国 5327 例，349 例死亡）' },

  { id: 'cn-t-wenchuan', domain: 'era', minAge: 5, maxAge: 80, minYear: 2008, maxYear: 2008, cond: CHN,
    text: '五月十二日下午两点二十八分。你脚下的地突然晃了一下——一开始以为是错觉，然后桌子上的水杯倒了。电视里的新闻越来越严重，死亡数字从几百涨到了几万。你在公司楼下排队捐钱，前面的人掏出了一千块。',
    effects: { happiness: -8 }, weight: 4, once: true,
    dataSource: '汶川地震 2008 年 5 月 12 日（69227 人死亡，17923 人失踪）' },

  { id: 'cn-t-olympics', domain: 'era', minAge: 3, maxAge: 90, minYear: 2008, maxYear: 2008, cond: CHN,
    text: '八月八日晚上八点。你坐在电视机前——全国十三亿人几乎都坐在电视机前。开幕式开始了，那个巨大的「和」字在场地中央升起来的时候，你听到了楼上传来的欢呼声，隔壁传来欢呼声，整栋楼都在欢呼。你也站了起来，虽然你不确定自己为什么要站起来。',
    effects: { happiness: 8 }, weight: 5, once: true,
    dataSource: '北京奥运会 2008 年 8 月 8-24 日' },

  { id: 'cn-t-covid', domain: 'era', minAge: 0, maxAge: 90, minYear: 2020, maxYear: 2022, cond: CHN,
    text: '封城了。你被关在家里整整两个月，出门要凭证、量体温、扫码。你在阳台上看到对面楼的邻居也在阳台上——你们隔空喊了几句话，虽然互相不认识。后来解封了，你走出家门的那一刻，觉得阳光刺眼。',
    effects: { health: -5, happiness: -10 }, weight: 4, once: true,
    dataSource: 'COVID-19 疫情 2020-2022（武汉封城 76 天）' },

  { id: 'cn-t-covid-end', domain: 'era', minAge: 0, maxAge: 90, minYear: 2022, maxYear: 2023, cond: CHN,
    text: '政策放开了。你阳了一次，烧了三天，嗓子疼得像吞刀片。但一个星期之后你好了，然后你走出家门，坐地铁、逛商场、去餐馆吃饭——这些你以前觉得理所当然的事，现在每一件都让你觉得「回来了」。',
    effects: { health: -3, happiness: 8 }, weight: 3, once: true,
    dataSource: '疫情防控政策调整 2022 年 12 月' },

  { id: 'cn-t-hukou', domain: 'era', minAge: 18, maxAge: 40, minYear: 1990, maxYear: 2026, cond: CHN_RURAL,
    text: '你的户口本上写着「农业户口」。这三个字决定了你能不能在城市里安家、你的孩子能不能在城里上学、你老了以后有没有退休金。你进城打了十年工，建了这个城市的高楼大厦，但这个城市不认为你是它的人。',
    effects: { wealth: -3, happiness: -5 }, weight: 3, once: true,
    dataSource: '户籍制度（城乡二元结构）' },
];

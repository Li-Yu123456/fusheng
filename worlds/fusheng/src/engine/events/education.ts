// 教育域：教育是「代际跃迁」的主杠杆——条件概率里故意让财富/性别/国情参与，
// 低资源环境里辍学风险真实地更高（这是数据叙事，不是价值判断）。
import type { EventTemplate } from './index';

export const EDUCATION: EventTemplate[] = [
  {
    id: 'ed-start',
    maxYear: 1995, // 手缝书包到 90 年代中期为止
    minYear: 1000,
    domain: 'education',
    minAge: 6,
    maxAge: 7,
    text: '背上母亲缝的布书包，上学路来回走了三遍才舍得进教室。',
    effects: { education: 6 },
    once: true,
  },
  {
    id: 'ed-exam-win',
    domain: 'education',
    minAge: 8,
    maxAge: 18,
    text: '放榜那天，{name}的名字排在最前头，父亲把奖状贴上了堂屋正墙。',
    effects: { education: 4, happiness: 4 },
  },
  {
    id: 'ed-exam-fail',
    minYear: 1900,
    domain: 'education',
    minAge: 10,
    maxAge: 18,
    text: '一道数学题葬送了半个学期，{name}把卷子折成了纸飞机。',
    effects: { education: -2, happiness: -3 },
  },
  {
    id: 'ed-mentor',
    domain: 'education',
    minAge: 10,
    maxAge: 20,
    text: '一位老先生借给{name}三本书，只说了句：山外有山。',
    effects: { education: 6 },
  },
  {
    id: 'ed-dropout',
    domain: 'education',
    minAge: 12,
    maxAge: 16,
    // 家庭财力不足时出现这道坎；低受教育社会里女童更易失学——OWID 性别入学差距的数据叙事
    cond: (c) => c.state.wealth < 35 || (c.gender === 'f' && c.snapshot.schooling < 5),
    text: '家里凑不齐下学期的学费，灯下的谈话声音很轻，分量很重。',
    choice: {
      prompt: '书还要不要读下去？',
      options: [
        {
          label: '全家咬牙供',
          effects: { education: 8, wealth: -8 },
          outcome: '亲戚那里借了个遍，{name}的课桌又留了一学期。',
        },
        {
          label: '辍学去打工',
          effects: { education: -10, wealth: 6 },
          outcome: '书包挂上了墙，{name}进了镇上的厂子。',
        },
      ],
    },
  },
  {
    id: 'ed-gaokao',
    domain: 'education',
    minAge: 18,
    maxAge: 19,
    text: '成年礼是一场大考：考场还是社会，摆在眼前。',
    choice: {
      prompt: '要不要搏一场大考？',
      options: [
        {
          label: '全力备考',
          // 教育积累越高，命运越倾向让你考——权重而非门槛，保留逆袭可能
          weight: (c) => 1 + c.state.education / 25,
          effects: { education: 10 },
          outcome: '灯又亮了三百个夜晚，{name}把课本翻出了毛边。',
        },
        {
          label: '直接谋生',
          weight: (c) => 1 + (60 - c.state.education) / 25,
          effects: { education: -5, wealth: 8 },
          outcome: '早一步挣钱养家，也是一种答案。',
        },
      ],
    },
    once: true,
  },
  {
    id: 'ed-college',
    domain: 'education',
    minAge: 19,
    maxAge: 23,
    cond: (c) => c.state.education > 55,
    text: '录取通知寄到那天，村里人都来道贺，鞭炮响了两挂。',
    effects: { education: 10, happiness: 8 },
    once: true,
  },
  {
    id: 'ed-night-school',
    maxYear: 1995,
    domain: 'education',
    minAge: 16,
    maxAge: 40,
    cond: (c) => c.state.education < 40,
    text: '白天做工，夜里啃书——{name}认下了这口气。',
    effects: { education: 7, health: -3 },
  },
  {
    id: 'ed-old-book',
    domain: 'education',
    minAge: 8,
    maxAge: 60,
    text: '在旧书摊淘到一本没头没尾的书，就着雨季读完了。',
    effects: { education: 3, happiness: 2 },
  },

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
    maxYear: 2005,
    domain: 'education',
    minAge: 16,
    maxAge: 28,
    text: '借来的词典翻到脱页，你用米饭粒把最常查的那几页粘了回去。',
    effects: { education: 4 },
  },
];

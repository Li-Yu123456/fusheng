// 抽象人生——你投胎成什么不重要，重要的是你有多抽象
import { useState, useCallback, useMemo } from 'react';
import type { AbstractLifeEvent } from '../../shared/types';

// ── 抽象事件池（比浮生短但更癫）──
const EVENTS: AbstractLifeEvent[] = [
  { age: 0, text: '你出生了。护士看了你一眼，说：「这孩子面相……很抽象。」', type: 'meme', effects: { abstractPower: 5, memeIndex: 1 } },
  { age: 1, text: '你学会了说话。你说的第一个词不是「妈妈」，是「典」。你妈破防了。', type: 'meme', effects: { abstractPower: 10, mentalDamage: -5, memeIndex: 3 } },
  { age: 3, text: '你把家里的电视遥控器拆了，然后按回去了——多出来三个零件。你爹看着手里的螺丝，陷入了沉思。', type: 'random', effects: { abstractPower: 8, mentalDamage: 3 } },
  { age: 5, text: '幼儿园老师问大家长大想做什么。别的小朋友说「宇航员」「医生」，你说：「我想被优化。」教室安静了三秒。', type: 'meme', effects: { abstractPower: 15, mentalDamage: 5, socialCredit: -3 } },
  { age: 7, text: '你在学校考了全班倒数第三。你爹很生气，你说：「至少我不是倒数第一，遥遥领先。」你爹的巴掌也遥遥领先。', type: 'meme', effects: { abstractPower: 12, mentalDamage: 8, socialCredit: -5 } },
  { age: 10, text: '你迷上了打游戏。你的梦想是成为电竞选手。你的账号名叫「抽象之神」。你的段位是青铜。你说这是「大器晚成」。', type: 'social', effects: { abstractPower: 8, memeIndex: 2 } },
  { age: 12, text: '你在B站发了第一个视频。播放量：7。其中5次是你自己刷的。剩下2次是你用另一个号刷的。', type: 'tech', effects: { abstractPower: 5, mentalDamage: -3 } },
  { age: 14, type: 'choice', text: '', effects: {},
    choice: {
      prompt: '你初中毕业了，面前有三条路：',
      options: [
        { label: '读高中——然后高考', effects: { abstractPower: 5, mentalDamage: 10 }, outcome: '你上了高中。三年后你参加了高考。考完那天你走出考场，觉得自己的大脑像被人用勺子挖空了。分数出来了——不好不坏，上了一个不好不坏的大学，学了一个不好不坏的专业。你觉得这就是人生。' },
        { label: '读职校——学一门手艺', effects: { abstractPower: 10, mentalDamage: -5 }, outcome: '你学了数控。三年后你在工厂里操作一台价值三百万的机床。你的工资比同龄的大学生高。你在朋友圈发了一条动态：「读书不是唯一的出路。」配图是你的工位。' },
        { label: '直接打工——进厂', effects: { abstractPower: 15, mentalDamage: 8, socialCredit: -5 }, outcome: '你进了富士康。流水线上的日子像一台永不停歇的机器。三个月后你辞了工。六个月后你又回去了。不是因为你喜欢，是因为外面的世界更抽象。' },
      ],
    } },
  { age: 16, text: '你暗恋班上的一个人。你每天绕远路经过对方的教室。三个月后你发现对方已经转学了。你的暗恋变成了单方面的意淫。', type: 'random', effects: { abstractPower: 5, mentalDamage: -8 } },
  { age: 18, text: '你成年了。你的生日愿望是「希望明天不用早起」。第二天你早起了一个小时——为了抢食堂的早餐。', type: 'life', effects: { abstractPower: 3 } },
  { age: 20, text: '你在网上认识了一个很聊得来的人。你们聊了三个通宵。第四天你发现对方的头像是网图。你觉得被抽象了。', type: 'social', effects: { abstractPower: 10, mentalDamage: -5 } },
  { age: 22, type: 'choice', text: '', effects: {},
    choice: {
      prompt: '你毕业了。HR问你：「你的职业规划是什么？」',
      options: [
        { label: '「我想在大厂发光发热」', effects: { abstractPower: 5, mentalDamage: 15 }, outcome: '你进了大厂。第一天你收到了工牌、电脑和一条毛毯。你把毛毯铺在了工位下面的行军床上。三年后你的头发少了三分之一，存款多了三分之二。你不知道这笔交易划不划算。' },
        { label: '「我想考公务员」', effects: { abstractPower: 8, mentalDamage: 5 }, outcome: '你考了三年。第一年差2分，第二年差1分，第三年你终于考上了。你在办公室的第一天，科长让你帮他复印一份文件。你说了声「好」。这一声「好」，你说了十五年。' },
        { label: '「我不想工作」', effects: { abstractPower: 20, mentalDamage: -10, socialCredit: -10 }, outcome: '你成了自由职业者。你的自由职业包括但不限于：送外卖、跑滴滴、做代驾、写公众号。你管这叫「灵活就业」。你妈管这叫「不务正业」。' },
      ],
    } },
  { age: 24, text: '你的leader给你画了一张饼。饼的直径大约是三十厘米，上面撒了「期权」「晋升」「年终奖」三种芝麻。你咬了一口——全是空气。', type: 'meme', effects: { abstractPower: 15, mentalDamage: -5 } },
  { age: 25, text: '你开始相亲了。对方的第一句话是：「有房吗？」你的第二句话是：「再见。」', type: 'social', effects: { abstractPower: 8, mentalDamage: 3 } },
  { age: 26, text: '你在朋友圈看到同龄人晒娃、晒车、晒旅游。你默默地发了一条：今天的外卖到了。配图是一碗已经凉了的螺蛳粉。点赞：3。', type: 'random', effects: { abstractPower: 5, mentalDamage: -5 } },
  { age: 28, text: '你的朋友圈已经三个月没有更新了。不是因为你没有生活——而是因为你的生活不需要被展示。你获得了「朋友圈隐士」称号。', type: 'social', effects: { abstractPower: 10, socialCredit: 5 } },
  { age: 30, text: '你三十岁了。你开始收到「三十岁焦虑」的推送文章。你点开看了看，然后关掉了，继续刷短视频。焦虑是不可能焦虑的，这辈子都不可能焦虑的。', type: 'meme', effects: { abstractPower: 12, memeIndex: 2 } },
  { age: 32, text: '你的体检报告出来了。三高。医生说：「少熬夜。」你说好。当天晚上你刷手机到凌晨两点。', type: 'random', effects: { abstractPower: 5, mentalDamage: 8 } },
  { age: 35, text: '你在公司听到了一个词：「优化」。你知道这意味着什么。你开始更新简历了。猎头回复说：「您这个年纪……」你没等他说完就挂了电话。', type: 'tech', effects: { abstractPower: 15, mentalDamage: -10, socialCredit: -5 } },
  { age: 38, text: '你开始养生了。保温杯里泡枸杞，每天走一万步，早睡早起。你觉得自己像个老年人。但你的体检报告确实好了一点——从三高变成了两高。', type: 'life', effects: { abstractPower: 5, mentalDamage: -5 } },
  { age: 40, text: '四十岁生日那天，你一个人在家。你点了一碗长寿面，打开电视，看了一部老电影。你觉得这样挺好的。手机响了一下——是银行发来的房贷催缴短信。', type: 'random', effects: { abstractPower: 8, mentalDamage: 5 } },
  { age: 50, text: '你开始跳广场舞了。你发现自己居然很有节奏感。你成了广场舞天团的主力。你的粉丝是小区里的二十位阿姨。', type: 'social', effects: { abstractPower: 20, socialCredit: 10 } },
  { age: 60, text: '你退休了。你的退休金不多，但够花。你每天去公园打太极，然后去菜市场买菜。你觉得自己终于有时间做想做的事了——但你发现你不知道想做什么。', type: 'life', effects: { abstractPower: 10, mentalDamage: -3 } },
  { age: 70, text: '你七十岁了。你的孙辈来你家，抱着手机不撒手。你问他手机上有什么好玩的，他说「爷爷你不懂」。你想了想，确实不懂。但你也不太想懂了。', type: 'random', effects: { abstractPower: 15, memeIndex: 5 } },
  { age: 80, text: '你八十岁了。你坐在阳台上晒太阳，看着窗外的车水马龙。你觉得这座城市变了，又好像什么都没变。你端起茶杯喝了一口——茶凉了。你站起来去续热水，脚步很慢，但很稳。', type: 'life', effects: { abstractPower: 25, socialCredit: 20 } },
  { age: 99, text: '你死了。你的墓碑上刻着：「此人一生，遥遥领先。」你孙辈在葬礼上说：「爷爷走得很安详。」其实你是刷短视频的时候笑死的。死因：抽象。', type: 'meme', effects: { abstractPower: 100 } },
];

// ── 抽象身份（开局随机）──
const IDENTITIES = [
  { name: '薛定谔的猫', emoji: '🐱', desc: '你同时活着和死了。观测你之前，谁也不知道。' },
  { name: '一个Bug', emoji: '🐛', desc: '你在生产环境被发现了。但你不想被修。' },
  { name: 'Wi-Fi信号', emoji: '📶', desc: '你满格的时候没人注意你，你断了的时候所有人都骂你。' },
  { name: '外卖骑手的电动车', emoji: '🛵', desc: '你的电量决定了别人的晚餐。' },
  { name: '404页面', emoji: '🚫', desc: '你不知道自己为什么存在。你只知道别人找不到你。' },
  { name: '一条已读不回的消息', emoji: '📵', desc: '你被看见了，但被无视了。这可能是最抽象的存在方式。' },
  { name: '服务器日志', emoji: '📜', desc: '你记录了一切，但没人读你。' },
  { name: '一根数据线', emoji: '🔌', desc: '你总是在最需要的时候找不到自己。' },
  { name: 'HR的微笑', emoji: '🙂', desc: '你看起来很友善，但你意味着「我们不合适」。' },
  { name: '甲方的一句"再改改"', emoji: '🎯', desc: '你摧毁了无数设计师的周末。' },
];

interface LifeState {
  abstractPower: number;
  mentalDamage: number; // 正数=受伤，负数=治愈
  socialCredit: number;
  memeIndex: number;
  age: number;
  events: { text: string; effects?: Record<string, number> }[];
  isAlive: boolean;
  identity: { name: string; emoji: string; desc: string };
}

export default function LifeMode() {
  const [state, setState] = useState<LifeState | null>(null);
  const [pendingChoice, setPendingChoice] = useState<AbstractLifeEvent | null>(null);

  const startLife = useCallback(() => {
    const identity = IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)];
    setState({
      abstractPower: 0,
      mentalDamage: 0,
      socialCredit: 50,
      memeIndex: 0,
      age: 0,
      events: [],
      isAlive: true,
      identity,
    });
    setPendingChoice(null);
  }, []);

  const advance = useCallback(() => {
    if (!state || !state.isAlive) return;
    const next = EVENTS.find((e) => e.age > state.age);
    if (!next) {
      setState((s) => s ? { ...s, isAlive: false } : s);
      return;
    }
    setState((s) => s ? { ...s, age: next.age } : s);
    if (next.type === 'choice' && next.choice) {
      setPendingChoice(next);
    } else {
      setState((s) => {
        if (!s) return s;
        const ev = { text: next.text, effects: next.effects as Record<string, number> };
        return {
          ...s,
          abstractPower: s.abstractPower + (next.effects.abstractPower ?? 0),
          mentalDamage: s.mentalDamage + (next.effects.mentalDamage ?? 0),
          socialCredit: Math.max(0, s.socialCredit + (next.effects.socialCredit ?? 0)),
          memeIndex: s.memeIndex + (next.effects.memeIndex ?? 0),
          events: [...s.events, ev],
        };
      });
    }
  }, [state]);

  const makeChoice = useCallback((idx: number) => {
    if (!pendingChoice?.choice || !state) return;
    const opt = pendingChoice.choice.options[idx];
    setState((s) => {
      if (!s) return s;
      return {
        ...s,
        abstractPower: s.abstractPower + (opt.effects.abstractPower ?? 0),
        mentalDamage: s.mentalDamage + (opt.effects.mentalDamage ?? 0),
        socialCredit: Math.max(0, s.socialCredit + (opt.effects.socialCredit ?? 0)),
        memeIndex: s.memeIndex + (opt.effects.memeIndex ?? 0),
        events: [...s.events, { text: opt.outcome, effects: opt.effects as Record<string, number> }],
      };
    });
    setPendingChoice(null);
  }, [pendingChoice, state]);

  const abstractLevel = useMemo(() => {
    if (!state) return '';
    const p = state.abstractPower;
    if (p >= 100) return '抽象之神';
    if (p >= 60) return '抽象大师';
    if (p >= 30) return '抽象学者';
    if (p >= 10) return '抽象学徒';
    return '抽象萌新';
  }, [state?.abstractPower]);

  if (!state) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--text-dim)', marginBottom: 24 }}>
          你将以一个抽象事物的身份，过完抽象的一生。
        </p>
        <button className="btn btn-pink pulse" onClick={startLife}>
          开始抽象人生
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', margin: '16px 0', padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--neon-pink)' }}>
        <div style={{ fontSize: 40 }}>{state.identity.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--neon-pink)', marginTop: 4 }}>{state.identity.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{state.identity.desc}</div>
      </div>

      <div className="stats-bar">
        <div className="stat">抽象值 <span className="stat-value">{state.abstractPower}</span></div>
        <div className="stat">破防度 <span className="stat-value pink">{state.mentalDamage}</span></div>
        <div className="stat">社交分 <span className="stat-value blue">{state.socialCredit}</span></div>
        <div className="stat">梗力 <span className="stat-value yellow">{state.memeIndex}</span></div>
      </div>

      <div style={{ textAlign: 'center', margin: '8px 0 16px', fontSize: 13, color: 'var(--neon-yellow)' }}>
        当前称号：{abstractLevel} · {state.isAlive ? `${state.age} 岁` : '已终焉'}
      </div>

      {state.events.map((ev, i) => (
        <div key={i} className="life-event">{ev.text}</div>
      ))}

      {pendingChoice?.choice && (
        <div className="life-choice">
          <div className="choice-prompt">{pendingChoice.choice.prompt}</div>
          {pendingChoice.choice.options.map((opt, i) => (
            <button key={i} className="choice-btn" onClick={() => makeChoice(i)}>{opt.label}</button>
          ))}
        </div>
      )}

      {state.isAlive && !pendingChoice && (
        <button className="btn" onClick={advance} style={{ width: '100%', marginTop: 12 }}>
          {state.age === 0 ? '出生' : '继续'}
        </button>
      )}

      {!state.isAlive && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 16, color: 'var(--neon-green)', marginBottom: 12 }}>
            一生抽象值：{state.abstractPower} · 终极称号：{abstractLevel}
          </p>
          <button className="btn btn-outline" onClick={startLife}>再来一世</button>
        </div>
      )}
    </div>
  );
}

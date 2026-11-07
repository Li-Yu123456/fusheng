// 抽象签——替代新闻：每天抽一支完全不讲道理的签
import { useState, useCallback } from 'react';

// ── 签文池：每一条都不按常理出牌 ──
const FORTUNES = [
  { text: '大凶 · 今天你会收到一条你不想回复的消息', sub: '建议：已读不回，装死到底' },
  { text: '大吉 · 你的外卖会提前到达', sub: '但骑手会按错门铃，你会跑到邻居家门口等' },
  { text: '中签 · 你今天刷到的每一条短视频都不到10秒', sub: '你的注意力已经碎成了渣，恭喜' },
  { text: '大凶 · 你的手机会在你最需要的时候没电', sub: '但你不带充电宝出门，这是你的选择' },
  { text: '中吉 · 你会在朋友圈看到一条让你破防的内容', sub: '但你不会点赞，因为你不想让对方知道你还在看' },
  { text: '大吉 · 你的代码今天不会报错', sub: '因为今天你不会写代码（摸鱼）' },
  { text: '凶 · 你的领导今天会找你「聊聊」', sub: '「聊聊」的意思是：有新需求了，Deadline是昨天' },
  { text: '中签 · 你今天会遇到一个说「这个需求很简单」的人', sub: '建议：微笑，点头，然后在心里骂他' },
  { text: '大凶 · 你的Wi-Fi会断', sub: '在打排位的关键时刻。你会输。你会摔手机。你会后悔。' },
  { text: '大吉 · 你今天会遇到一只猫', sub: '猫会看你一眼然后走开。但被猫看过的人，运气会+1' },
  { text: '凶 · 你会点开一个「3分钟看完XX」的视频', sub: '然后你会看三个小时。你的人生就是这样被蚕食的' },
  { text: '中吉 · 你今天的心情是「淡淡的」', sub: '不是难过，也不是开心，就是淡淡的。像一杯放凉的白开水' },
  { text: '大吉 · 你的甲方今天不会找你', sub: '因为甲方在放假。但明天他会带着三天攒的需求轰炸你' },
  { text: '大凶 · 你今天会被已读不回', sub: '你发出去了三条消息。对方全部看了。对方全部没回。' },
  { text: '中签 · 你今天会纠结中午吃什么', sub: '你会打开外卖APP，滑20分钟，最后点了一份你上周点过的' },
  { text: '大吉 · 今天会有一个陌生人对你微笑', sub: '可能是认错人了。但那一秒钟的温暖是真实的' },
  { text: '凶 · 你今天会忘记一件重要的事', sub: '你不记得是什么。这就是问题所在' },
  { text: '中吉 · 你今天会在深夜想起一个不应该想起的人', sub: '然后你会打开对方的社交主页，看三分钟，关掉，继续刷短视频' },
  { text: '大凶 · 你的年终奖会被「优化」', sub: 'HR会说「今年效益不好」。但公司又租了一层楼' },
  { text: '大吉 · 你今天会发现一个很好笑的视频', sub: '你会笑出声。旁边的人会看你。你会假装在咳' },
  { text: '中签 · 你的社交电量今天只剩20%', sub: '建议：取消所有社交计划，在家躺着' },
  { text: '凶 · 你今天会刷到前任的朋友圈', sub: '对方过得很好。你会假装不在意。但你会多看两眼' },
  { text: '大吉 · 你今天的运气值已充满', sub: '具体表现为：你能在冰箱里找到一样你忘了买的好吃的' },
  { text: '中吉 · 你今天会收到一个「在吗」', sub: '不要回。回了就是帮忙的开始' },
  { text: '大凶 · 你今天的代码会在生产环境崩掉', sub: '但你会发现是你同事写的。恭喜你，逃过一劫' },
  { text: '大吉 · 你今天会在便利店买到最后一份关东煮', sub: '这不是运气，这是命运' },
  { text: '凶 · 你今天会做一道选择题', sub: '选项A和选项B都不好。你会选C：装作没看到这道题' },
  { text: '中签 · 你的网速今天会变慢', sub: '不是因为网络问题，是因为你的路由器已经工作了五年' },
  { text: '大吉 · 今天是摸鱼的黄道吉日', sub: '老板不在，同事都在摸，你不摸就是不合群' },
  { text: '大凶 · 你今天会破防', sub: '原因：看到一条戳心的评论。持续时间：三分钟。后遗症：情绪低落一整天' },
];

// 签号（按日期固定——同一天抽到同一支）
function getDailyIndex(): number {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return seed % FORTUNES.length;
}

export default function FortuneMode() {
  const [drawn, setDrawn] = useState(false);
  const index = getDailyIndex();
  const fortune = FORTUNES[index];

  const shake = useCallback(() => {
    // 摇签筒动画——但结果不变（命运已定）
    setDrawn(false);
    setTimeout(() => setDrawn(true), 100);
  }, []);

  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20, transform: 'rotate(-1deg)' }}>
        <p style={{ fontSize: 13, color: 'var(--chaos-b)' }}>
          {today} · 每天一支 · 命运不可更改
        </p>
        <p style={{ fontSize: 11, color: 'rgba(234,255,234,.3)', fontStyle: 'italic', marginTop: 4 }}>
          （你摇一百次结果都一样，这就是命）
        </p>
      </div>

      {!drawn ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 60, marginBottom: 16, animation: 'wobble 2s ease-in-out infinite' }}>🥢</div>
          <button className="btn" onClick={() => setDrawn(true)}>摇签</button>
        </div>
      ) : (
        <div className="fortune-stick fade-up">
          <div className="fortune-text">{fortune.text}</div>
          <div className="fortune-sub">{fortune.sub}</div>
        </div>
      )}

      {drawn && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-d" onClick={shake} style={{ fontSize: 13 }}>
            不服，再摇一次
          </button>
          <p style={{ fontSize: 11, color: 'rgba(234,255,234,.3)', marginTop: 8, fontStyle: 'italic' }}>
            （结果还是一样的，但你可以试试）
          </p>
        </div>
      )}
    </div>
  );
}

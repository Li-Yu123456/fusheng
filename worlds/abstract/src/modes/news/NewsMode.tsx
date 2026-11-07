// 抽象新闻——完全不存在的新闻，但格式很正经
import { useMemo } from 'react';
import { NEWS } from '../../shared/data';
import type { NewsItem } from '../../shared/types';

const CATEGORY_EMOJI: Record<string, string> = {
  '科技': '🤖', '财经': '💸', '社会': '👥', '娱乐': '🎬', '体育': '⚽', '国际': '🌍',
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NewsMode() {
  const news = useMemo(() => shuffleArray(NEWS), []);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
          本页新闻纯属虚构，如有雷同——那就是太巧了。<br />
          可信度评分越低，越抽象。
        </p>
      </div>
      {news.map((n) => (
        <NewsCard key={n.id} item={n} />
      ))}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const emoji = CATEGORY_EMOJI[item.category] ?? '📰';
  const credLabel = item.credibility < 10 ? '极其抽象' : item.credibility < 30 ? '非常抽象' : item.credibility < 60 ? '有点抽象' : '勉强像真的';
  const credColor = item.credibility < 10 ? 'var(--neon-pink)' : item.credibility < 30 ? 'var(--neon-yellow)' : 'var(--neon-green)';

  return (
    <div className="card fade-up" style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span className="tag tag-blue">{item.category}</span>
      </div>
      <div className="news-headline">{item.headline}</div>
      <div className="news-body">{item.body}</div>
      <div className="news-meta">
        <span className="news-cred" style={{ color: credColor }}>
          可信度 {item.credibility}% · {credLabel}
        </span>
        <span className="news-date">{item.date}</span>
      </div>
    </div>
  );
}

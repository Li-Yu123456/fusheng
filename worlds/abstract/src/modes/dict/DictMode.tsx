// 抽象词典——中文互联网黑话实时查询
import { useState, useMemo } from 'react';
import { MEMES } from '../../shared/data';

export default function DictMode() {
  const [query, setQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = MEMES;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((m) =>
        m.term.toLowerCase().includes(q) ||
        m.meaning.includes(q) ||
        m.tags.some((t) => t.includes(q))
      );
    }
    if (filterLevel !== null) {
      list = list.filter((m) => m.level === filterLevel);
    }
    return list;
  }, [query, filterLevel]);

  return (
    <div>
      <div className="dict-search">
        <input
          className="input"
          placeholder="搜索梗 / 黑话 / 缩写…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filterLevel === null ? '' : 'btn-outline'}`}
          onClick={() => setFilterLevel(null)}
        >全部</button>
        {[1, 2, 3, 4, 5].map((l) => (
          <button
            key={l}
            className={`btn btn-sm ${filterLevel === l ? '' : 'btn-outline'}`}
            onClick={() => setFilterLevel(l)}
          >{'★'.repeat(l)}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
          没找到这个梗——说明它还不够抽象，或者已经被时代淘汰了。
        </p>
      ) : (
        filtered.map((m) => (
          <div key={m.term} className="card dict-item fade-up">
            <div className="dict-term">{m.term}</div>
            <div className="dict-meaning">{m.meaning}</div>
            <div className="dict-example">例句：{m.example}</div>
            <div className="dict-meta" style={{ marginTop: 8 }}>
              <span className="tag tag-neon">{'★'.repeat(m.level)}</span>
              <span className="tag tag-blue">{m.era}</span>
              <span className="tag tag-pink">{m.origin}</span>
              {m.tags.map((t) => <span key={t} className="tag tag-yellow">#{t}</span>)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

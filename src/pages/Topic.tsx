import { Link, useParams } from "react-router-dom";
import { useManifest, findTopic } from "../lib/manifest";
import { isDark } from "../lib/types";

export default function Topic() {
  const { topicId = "" } = useParams();
  const { data, loading } = useManifest();
  const topic = findTopic(data, topicId);

  if (loading) {
    return (
      <div className="wrap section">
        <div className="skeleton" style={{ height: 180, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="wrap section">
        <div className="empty">
          토픽을 찾을 수 없습니다. <Link to="/">아카이브로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap section">
      <Link to="/" className="btn btn-ghost btn-sm" style={{ marginLeft: -12 }}>
        ← 아카이브
      </Link>

      <div
        className={`topic-banner bg-${topic.color}${
          isDark(topic.color) ? " on-dark" : ""
        }`}
      >
        <span className="caption">
          {topic.id.toUpperCase()} · {topic.lessons.length} LESSONS
        </span>
        <h1>{topic.title}</h1>
        <p>{topic.subtitle}</p>
      </div>

      <div className="lesson-list">
        {topic.lessons.map((l, i) => (
          <Link
            key={l.id}
            to={`/t/${topic.id}/${l.id}`}
            className="lesson-row"
          >
            <span className="idx">{String(i + 1).padStart(2, "0")}</span>
            <span className="l-body">
              <span className="l-title">{l.title}</span>
              {l.subtitle && <span className="l-sub">{l.subtitle}</span>}
            </span>
            <span className="l-go">→</span>
          </Link>
        ))}
        {topic.lessons.length === 0 && (
          <div className="empty">이 토픽에는 아직 레슨이 없습니다.</div>
        )}
      </div>
    </div>
  );
}

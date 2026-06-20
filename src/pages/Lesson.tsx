import { Link, useNavigate, useParams } from "react-router-dom";
import { useManifest, findTopic } from "../lib/manifest";

export default function Lesson() {
  const { topicId = "", lessonId = "" } = useParams();
  const { data, loading } = useManifest();
  const nav = useNavigate();
  const topic = findTopic(data, topicId);
  const idx = topic?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = idx >= 0 ? topic!.lessons[idx] : null;
  const prev = idx > 0 ? topic!.lessons[idx - 1] : null;
  const next =
    topic && idx >= 0 && idx < topic.lessons.length - 1
      ? topic.lessons[idx + 1]
      : null;

  if (loading) {
    return (
      <div className="viewer">
        <div className="viewer-bar">
          <span className="v-title">불러오는 중…</span>
        </div>
        <div className="skeleton viewer-frame" />
      </div>
    );
  }

  if (!topic || !lesson) {
    return (
      <div className="wrap section">
        <div className="empty">
          레슨을 찾을 수 없습니다. <Link to="/">아카이브로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <Link
          to={`/t/${topic.id}`}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: -6 }}
        >
          목록
        </Link>
        <span className="v-title">{lesson.title}</span>
        <div className="viewer-nav">
          <button
            className="btn btn-secondary btn-sm"
            disabled={!prev}
            onClick={() => prev && nav(`/t/${topic.id}/${prev.id}`)}
            aria-label="이전 레슨"
          >
            이전
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!next}
            onClick={() => next && nav(`/t/${topic.id}/${next.id}`)}
            aria-label="다음 레슨"
          >
            다음
          </button>
        </div>
      </div>
      <div className="viewer-shell">
        <aside className="lesson-sidebar" aria-label={`${topic.title} 레슨 목록`}>
          <div className="lesson-sidebar-head">
            <span className="caption">{topic.id.toUpperCase()}</span>
            <strong>{topic.title}</strong>
          </div>
          <nav className="lesson-sidebar-list">
            {topic.lessons.map((item, itemIndex) => (
              <Link
                key={item.id}
                to={`/t/${topic.id}/${item.id}`}
                className={`lesson-sidebar-link ${
                  item.id === lesson.id ? "is-current" : ""
                }`}
                aria-current={item.id === lesson.id ? "page" : undefined}
              >
                <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </nav>
        </aside>
        <iframe
          key={lesson.id}
          className="viewer-frame"
          src={`/${lesson.file}`}
          title={lesson.title}
          sandbox="allow-same-origin allow-popups allow-scripts"
        />
      </div>
    </div>
  );
}

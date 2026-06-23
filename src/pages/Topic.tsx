import { Link, useParams } from "react-router-dom";
import { useManifest, findTopic } from "../lib/manifest";

export default function Topic() {
  const { topicId = "" } = useParams();
  const { data, loading } = useManifest();
  const topic = findTopic(data, topicId);

  if (loading) {
    return (
      <div className="archive-section">
        <div className="skeleton table-skeleton" />
        <div className="skeleton table-skeleton" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="archive-section">
        <div className="empty">토픽을 찾을 수 없습니다. <Link to="/">아카이브로</Link></div>
      </div>
    );
  }

  return (
    <div className="topic-page">
      <section className="topic-banner" data-mark={topic.id.slice(0, 2).toUpperCase()}>
        <div className="topic-kicker">{topic.id.toUpperCase()} / {topic.lessons.length} LESSONS</div>
        <h1>{topic.title}</h1>
        <p>{topic.subtitle}</p>
        <Link to="/" className="topic-back">← Archive</Link>
      </section>

      <section className="archive-section">
        <div className="sec-head">
          <span className="num">{String(topic.order).padStart(2, "0")}</span>
          <span className="title"><strong>LESSON LIST</strong> / {topic.id}</span>
          <span className="right">{topic.lessons.length} files</span>
        </div>

        <div className="lesson-board topic-lessons">
          <div className="lesson-board-head" aria-hidden="true">
            <span>No</span><span>Lesson</span><span>Kind</span><span>Status</span><span>Open</span>
          </div>
          {topic.lessons.map((lesson, index) => (
            <Link key={lesson.id} to={`/t/${topic.id}/${lesson.id}`} className="board-row">
              <span className="board-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="board-title">
                {lesson.title}
                {lesson.subtitle && <small>{lesson.subtitle}</small>}
              </span>
              <span className="board-topic">HTML</span>
              <span className="board-date">READY</span>
              <span className="board-arrow">↗</span>
            </Link>
          ))}
          {topic.lessons.length === 0 && <div className="empty">이 토픽에는 표시할 레슨이 없습니다.</div>}
        </div>
      </section>
    </div>
  );
}

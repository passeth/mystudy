import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useManifest, findTopic } from "../lib/manifest";

type ShareStatus = "idle" | "copied" | "shared" | "failed";

export default function Lesson() {
  const { topicId = "", lessonId = "" } = useParams();
  const { data, loading } = useManifest();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
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

  const currentTopic = topic;
  const currentLesson = lesson;

  async function shareLesson(): Promise<void> {
    const url = `${window.location.origin}/t/${currentTopic.id}/${currentLesson.id}`;
    const title = currentLesson.title;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title,
          text: `${currentTopic.title} · ${title}`,
          url,
        });
        setShareStatus("shared");
        window.setTimeout(() => setShareStatus("idle"), 1800);
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (error instanceof Error) {
        setShareStatus("failed");
        window.setTimeout(() => setShareStatus("idle"), 2200);
        return;
      }
      setShareStatus("failed");
      window.setTimeout(() => setShareStatus("idle"), 2200);
    }
  }

  const shareLabel =
    shareStatus === "copied"
      ? "복사됨"
      : shareStatus === "shared"
        ? "공유됨"
        : shareStatus === "failed"
          ? "실패"
          : "공유";

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <Link
          to={`/t/${currentTopic.id}`}
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: -6 }}
        >
          목록
        </Link>
        <span className="v-title">{currentLesson.title}</span>
        <button
          className={`btn btn-secondary btn-sm share-btn ${
            shareStatus !== "idle" ? "is-done" : ""
          }`}
          type="button"
          onClick={() => void shareLesson()}
          aria-live="polite"
        >
          {shareLabel}
        </button>
        <button
          className="btn btn-secondary btn-sm lesson-list-toggle"
          type="button"
          aria-controls="lesson-topic-list"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          글목록
        </button>
        <div className="viewer-nav">
          <button
            className="btn btn-secondary btn-sm"
            disabled={!prev}
            onClick={() => {
              if (!prev) return;
              setSidebarOpen(false);
              nav(`/t/${currentTopic.id}/${prev.id}`);
            }}
            aria-label="이전 레슨"
          >
            이전
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!next}
            onClick={() => {
              if (!next) return;
              setSidebarOpen(false);
              nav(`/t/${currentTopic.id}/${next.id}`);
            }}
            aria-label="다음 레슨"
          >
            다음
          </button>
        </div>
      </div>
      <div className={`viewer-shell ${sidebarOpen ? "is-sidebar-open" : ""}`}>
        <aside
          className="lesson-sidebar"
          id="lesson-topic-list"
          aria-label={`${currentTopic.title} 레슨 목록`}
        >
          <div className="lesson-sidebar-head">
            <span className="caption">{currentTopic.id.toUpperCase()}</span>
            <strong>{currentTopic.title}</strong>
          </div>
          <nav className="lesson-sidebar-list">
            {currentTopic.lessons.map((item, itemIndex) => (
              <Link
                key={item.id}
                to={`/t/${currentTopic.id}/${item.id}`}
                className={`lesson-sidebar-link ${
                  item.id === currentLesson.id ? "is-current" : ""
                }`}
                aria-current={item.id === currentLesson.id ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <span>{String(itemIndex + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </nav>
        </aside>
        <iframe
          key={currentLesson.id}
          className="viewer-frame"
          src={`/${currentLesson.file}`}
          title={currentLesson.title}
          sandbox="allow-same-origin allow-popups allow-scripts"
        />
      </div>
    </div>
  );
}

import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useManifest } from "../lib/manifest";
import { isDark } from "../lib/types";

export default function Home() {
  const { data, loading, error } = useManifest();

  const topics = data?.topics ?? [];
  const lessonCount = topics.reduce((n, t) => n + t.lessons.length, 0);
  const recentLessons = topics
    .flatMap((topic) =>
      topic.lessons.map((lesson) => ({
        ...lesson,
        topicId: topic.id,
        topicTitle: topic.title,
      }))
    )
    .slice(0, 5);
  const panelRows = recentLessons.length
    ? recentLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        topicTitle: lesson.topicTitle,
      }))
    : Array.from({ length: 3 }, (_, index) => ({
        id: `empty-${index}`,
        title: "새 레슨을 기다리는 중",
        topicTitle: "empty",
      }));

  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow">LEARNING ARCHIVE</span>
          <h1 className="display-xl">
            학습 기록을
            <br />
            다시 쓸 수 있는 형태로.
          </h1>
          <p className="lede">
            AI 스킬이 만든 HTML을 규정, 제품, 시스템 주제별로 쌓고 필요한 순간
            바로 꺼내 읽는 개인 작업대입니다.
          </p>
          <div className="hero-cta">
            <Link to="/upload" className="btn btn-primary">
              HTML 업로드
            </Link>
            {topics[0] && (
              <Link to={`/t/${topics[0].id}`} className="btn btn-secondary">
                첫 토픽 열기
              </Link>
            )}
          </div>
        </div>
        <div className="archive-panel" aria-label="아카이브 요약">
          <div className="panel-toolbar">
            <span className="panel-mark" />
            <span className="caption">mystudy index</span>
            <span className="panel-date">{new Date().getFullYear()}</span>
          </div>
          <div className="panel-metrics">
            <div>
              <span className="metric-number">{topics.length}</span>
              <span className="caption">topics</span>
            </div>
            <div>
              <span className="metric-number">{lessonCount}</span>
              <span className="caption">lessons</span>
            </div>
          </div>
          <div className="panel-stack">
            {panelRows.map((lesson, index) => (
              <div
                key={lesson.id}
                className="panel-row"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="panel-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="panel-title">{lesson.title}</span>
                <span className="panel-topic">{lesson.topicTitle}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">BROWSE</span>
            <h2 className="display-lg" style={{ marginTop: 10 }}>
              토픽
            </h2>
          </div>
          <Link to="/upload" className="btn btn-ghost btn-sm">
            토픽 추가
          </Link>
        </div>

        {loading && (
          <div className="topic-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 248 }} />
            ))}
          </div>
        )}

        {error && (
          <div className="empty">
            아카이브를 불러오지 못했습니다. ({error})
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="empty">
            아직 토픽이 없습니다. <Link to="/upload">첫 학습 HTML</Link>을
            업로드해 보세요.
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="topic-grid">
            {topics.map((t, index) => (
              <Link
                key={t.id}
                to={`/t/${t.id}`}
                className={`topic-card ${index === 0 ? "topic-card-wide" : ""} bg-${t.color}${
                  isDark(t.color) ? " on-dark" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <div className="t-meta">
                  <span className="caption">{t.id.toUpperCase()}</span>
                  <span className="t-count">{t.lessons.length} lessons</span>
                </div>
                <div>
                  <h3>{t.title}</h3>
                  <p className="t-sub">{t.subtitle}</p>
                </div>
                <div className="t-preview" aria-hidden="true">
                  {t.lessons.slice(0, 3).map((lesson, lessonIndex) => (
                    <span key={lesson.id}>
                      {String(lessonIndex + 1).padStart(2, "0")} {lesson.title}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

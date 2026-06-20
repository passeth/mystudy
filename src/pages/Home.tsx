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
    .slice(0, 8);
  const heroTopics = topics.slice(0, 3);

  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy center-copy">
          <span className="eyebrow hero-eyebrow">LEARNING ARCHIVE</span>
          <h1 className="display-xl">
            Learn Once.
            <br />
            Use It Again.
          </h1>
          <p className="lede">
            AI 스킬이 만든 HTML을 토픽별 카드와 최근 레슨 보드로 정리합니다.
            읽기, 비교, 재사용이 빠르게 이어지도록 첫 화면에서 맥락을 보여줍니다.
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
        <div className="hero-showcase" aria-label="학습 아카이브 미리보기">
          <div className="showcase-header">
            <span>mystudy board</span>
            <span>{topics.length} topics</span>
          </div>
          <div className="showcase-tiles">
            {heroTopics.map((topic, index) => (
              <Link
                key={topic.id}
                to={`/t/${topic.id}`}
                className={`showcase-tile bg-${topic.color}${
                  isDark(topic.color) ? " on-dark" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <span>{topic.id.toUpperCase()}</span>
                <strong>{topic.title}</strong>
              </Link>
            ))}
          </div>
          <div className="showcase-strip">
            <div>
              <span className="metric-number">{lessonCount}</span>
              <span className="caption">saved lessons</span>
            </div>
            <div>
              <span className="metric-number">
                {recentLessons.length ? recentLessons[0].topicTitle : "ready"}
              </span>
              <span className="caption">latest topic</span>
            </div>
          </div>
        </div>
        <div className="hero-glow" aria-hidden="true" />
      </section>

      <section className="section wrap topics-section">
        <div className="section-head editorial-head">
          <div>
            <span className="eyebrow">TOPICS</span>
            <h2 className="display-lg" style={{ marginTop: 10 }}>
              토픽별로 읽는 학습 묶음
            </h2>
          </div>
          <Link to="/upload" className="btn btn-ghost btn-sm">
            토픽 추가
          </Link>
        </div>

        {loading && (
          <div className="topic-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton topic-skeleton" />
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
                className={`topic-card bg-${t.color}${
                  isDark(t.color) ? " on-dark" : ""
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <div className="t-copy">
                  <div className="t-meta">
                    <span className="caption">{t.id.toUpperCase()}</span>
                    <span className="t-count">{t.lessons.length} lessons</span>
                  </div>
                  <h3>{t.title}</h3>
                  <p className="t-sub">{t.subtitle}</p>
                </div>
                <div className="t-logo-block" aria-hidden="true">
                  <span>{t.id.slice(0, 2).toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section wrap">
        <div className="section-head editorial-head">
          <div>
            <span className="eyebrow">RECENT BOARD</span>
            <h2 className="display-lg" style={{ marginTop: 10 }}>
              최근 레슨
            </h2>
          </div>
        </div>

        <div className="lesson-board">
          {recentLessons.map((lesson, index) => (
            <Link
              key={`${lesson.topicId}-${lesson.id}`}
              to={`/t/${lesson.topicId}/${lesson.id}`}
              className="board-row"
              style={{ "--i": index } as CSSProperties}
            >
              <span className="board-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="board-title">{lesson.title}</span>
              <span className="board-topic">{lesson.topicTitle}</span>
            </Link>
          ))}
          {!recentLessons.length && !loading && (
            <div className="empty">
              아직 표시할 레슨이 없습니다. <Link to="/upload">업로드</Link>에서
              첫 글을 추가해 보세요.
            </div>
          )}
          {loading && (
            <>
              <div className="skeleton board-skeleton" />
              <div className="skeleton board-skeleton" />
              <div className="skeleton board-skeleton" />
            </>
          )}
        </div>
      </section>
    </>
  );
}

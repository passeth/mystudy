import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useManifest } from "../lib/manifest";

export default function Home() {
  const { data, loading, error } = useManifest();

  const topics = data?.topics ?? [];
  const lessonCount = topics.reduce((sum, topic) => sum + topic.lessons.length, 0);
  const recentLessons = topics
    .flatMap((topic) =>
      topic.lessons.map((lesson) => ({
        ...lesson,
        topicId: topic.id,
        topicTitle: topic.title,
      }))
    )
    .slice(0, 10);

  return (
    <>
      <section className="hero">
        <div className="hero-numeral">
          <div className="crosshair">
            <span className="label">Index</span>
            <span>{String(topics.length).padStart(2, "0")} topics</span>
            <span>{String(lessonCount).padStart(2, "0")} lessons</span>
          </div>
          <div className="big">MY</div>
          <div className="baseline">Learning archive / reusable html records</div>
        </div>
        <div className="hero-meta">
          <div className="top-row">
            <span className="tag">Static system</span>
            <span className="live"><i className="blink" /> manifest live</span>
          </div>
          <div>
            <h1 className="hero-headline">
              Learn once.<br />
              Use it <span className="red">again.</span>
            </h1>
            <p className="hero-lede">
              AI 스킬이 만든 HTML 레슨을 토픽별 인덱스로 보관합니다.
              읽기, 비교, 재사용이 빠르게 이어지도록 학습 기록을 하나의
              산업형 아카이브 표면으로 정리합니다.
            </p>
          </div>
          <div className="hero-cta-row">
            {topics[0] && (
              <Link to={`/t/${topics[0].id}`}>
                첫 토픽 열기 <span className="arrow">↗</span>
              </Link>
            )}
            <a href="#topics">
              토픽 인덱스 <span className="arrow">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section id="topics" className="archive-section">
        <div className="sec-head">
          <span className="num">01</span>
          <span className="title"><strong>TOPICS</strong> / 학습 묶음</span>
          <span className="right">{topics.length} records</span>
        </div>

        {loading && (
          <div className="topic-index">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton table-skeleton" />)}
          </div>
        )}

        {error && <div className="empty">아카이브를 불러오지 못했습니다. ({error})</div>}

        {!loading && !error && topics.length === 0 && (
          <div className="empty">아직 토픽이 없습니다. 로컬 레포에서 학습 HTML을 추가한 뒤 배포해 주세요.</div>
        )}

        {!loading && topics.length > 0 && (
          <div className="topic-index">
            <div className="topic-index-head" aria-hidden="true">
              <span>No</span><span>Topic</span><span>Description</span><span>Lessons</span><span>Open</span>
            </div>
            {topics.map((topic, index) => (
              <Link
                key={topic.id}
                to={`/t/${topic.id}`}
                className="topic-row"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="t-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="t-title"><span className="id">{topic.id}</span>{topic.title}</span>
                <span className="t-sub">{topic.subtitle}</span>
                <span className="t-count"><span className="n">{topic.lessons.length}</span>lessons</span>
                <span className="t-arrow">↗</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="breaking" aria-hidden="true">
        <div className="breaking-track">
          <span>RETRIEVE <i className="sep">/</i> REVIEW <i className="sep">/</i> REUSE <i className="sep">/</i></span>
          <span>RETRIEVE <i className="sep">/</i> REVIEW <i className="sep">/</i> REUSE <i className="sep">/</i></span>
        </div>
      </div>

      <section className="manifesto">
        <aside className="manifesto-side">
          <span className="label">Operating rules</span>
          <span>Not a blog</span>
          <span>Not a dump</span>
          <p className="mission">
            각 레슨은 다시 읽히기 위해 보관됩니다. 토픽은 프로젝트의 지식 지도,
            레슨은 실행 가능한 단위, 레퍼런스는 오래 남는 압축본입니다.
          </p>
        </aside>
        <div className="manifesto-body">
          <div className="thesis visible">
            <span className="th-num">01</span>
            <div className="th-body">
              <h3>HTML은 완성된 학습 표면이다</h3>
              <p>레슨은 iframe으로 독립 보존되어, 각 스킬이 만든 원래의 상호작용과 인쇄 가능한 레이아웃을 유지합니다.</p>
            </div>
          </div>
          <div className="thesis visible">
            <span className="th-num">02</span>
            <div className="th-body">
              <h3>Manifest가 탐색의 계약이다</h3>
              <p>정적 파일과 토픽 메타데이터를 빌드 시점에 합쳐 화면은 항상 같은 데이터 계약만 읽습니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="archive-section">
        <div className="sec-head">
          <span className="num">02</span>
          <span className="title"><strong>RECENT BOARD</strong> / 최근 레슨</span>
          <span className="right">latest 10</span>
        </div>

        <div className="lesson-board">
          <div className="lesson-board-head" aria-hidden="true">
            <span>No</span><span>Lesson</span><span>Topic</span><span>Status</span><span>Open</span>
          </div>
          {recentLessons.map((lesson, index) => (
            <Link
              key={`${lesson.topicId}-${lesson.id}`}
              to={`/t/${lesson.topicId}/${lesson.id}`}
              className="board-row"
              style={{ "--i": index } as CSSProperties}
            >
              <span className="board-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="board-title">{lesson.title}</span>
              <span className="board-topic">{lesson.topicTitle}</span>
              <span className="board-date">READY</span>
              <span className="board-arrow">↗</span>
            </Link>
          ))}
          {!recentLessons.length && !loading && (
            <div className="empty">아직 표시할 레슨이 없습니다. 로컬 레포에서 학습 HTML을 추가한 뒤 배포해 주세요.</div>
          )}
          {loading && (
            <>
              <div className="skeleton table-skeleton" />
              <div className="skeleton table-skeleton" />
              <div className="skeleton table-skeleton" />
            </>
          )}
        </div>
      </section>
    </>
  );
}

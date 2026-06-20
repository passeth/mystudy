import { Link } from "react-router-dom";
import { useManifest } from "../lib/manifest";
import { isDark } from "../lib/types";

export default function Home() {
  const { data, loading, error } = useManifest();

  const topics = data?.topics ?? [];
  const lessonCount = topics.reduce((n, t) => n + t.lessons.length, 0);

  return (
    <>
      <section className="hero wrap">
        <span className="eyebrow">LEARNING ARCHIVE</span>
        <h1 className="display-xl" style={{ marginTop: 18 }}>
          배운 것을
          <br />
          토픽별로 모은다.
        </h1>
        <p className="lede">
          스킬로 만든 학습 HTML을 한 곳에 보관하고, 모바일에서 언제든 다시
          읽는 개인 아카이브. 새 주제가 생기면 토픽을 만들고 올리기만 하면
          됩니다.
        </p>
        <div className="hero-cta">
          <Link to="/upload" className="btn btn-primary">
            + 학습 HTML 업로드
          </Link>
          {topics[0] && (
            <Link to={`/t/${topics[0].id}`} className="btn btn-secondary">
              {topics[0].title} 보기
            </Link>
          )}
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="n">{topics.length}</div>
            <div className="l caption">TOPICS</div>
          </div>
          <div className="hero-stat">
            <div className="n">{lessonCount}</div>
            <div className="l caption">LESSONS</div>
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
            토픽 추가 →
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
            {topics.map((t) => (
              <Link
                key={t.id}
                to={`/t/${t.id}`}
                className={`topic-card bg-${t.color}${
                  isDark(t.color) ? " on-dark" : ""
                }`}
              >
                <div className="t-meta">
                  <span className="caption">{t.id.toUpperCase()}</span>
                  <span className="t-count">{t.lessons.length} lessons</span>
                </div>
                <div>
                  <h3>{t.title}</h3>
                  <p className="t-sub">{t.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

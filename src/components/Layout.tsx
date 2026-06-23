import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const onHome = loc.pathname === "/";

  return (
    <>
      <div className="register" aria-hidden="true">
        <div className="register-track">
          <span>
            <b>MYSTUDY ARCHIVE</b>
            <i className="sep">◆</i>
            <b>LESSONS / TOPICS / REFERENCES</b>
            <i className="sep">◆</i>
            <b>STATIC HTML KNOWLEDGE SYSTEM</b>
            <i className="sep">◆</i>
          </span>
          <span>
            <b>MYSTUDY ARCHIVE</b>
            <i className="sep">◆</i>
            <b>LESSONS / TOPICS / REFERENCES</b>
            <i className="sep">◆</i>
            <b>STATIC HTML KNOWLEDGE SYSTEM</b>
            <i className="sep">◆</i>
          </span>
        </div>
      </div>
      <header className="nav">
        <Link to="/" className="nav-brand" aria-label="mystudy 홈">
          <span className="dot" aria-hidden="true" />
          <span>mystudy</span>
        </Link>
        <nav className="nav-links" aria-label="주요 탐색">
          <Link to="/" className={onHome ? "active" : ""} aria-current={onHome ? "page" : undefined}>
            Archive
          </Link>
        </nav>
        <div className="nav-meta">KR / STATIC / 2026</div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>mystudy / 학습 기록 아카이브</span>
          <span>AI 스킬로 만든 HTML을 토픽별로 보관</span>
        </div>
      </footer>
    </>
  );
}

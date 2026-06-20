import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const onUpload = loc.pathname === "/upload";
  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <Link to="/" className="brand">
            <span className="dot" />
            mystudy
          </Link>
          <nav className="nav-actions">
            <Link to="/" className="btn btn-ghost btn-sm">
              아카이브
            </Link>
            {onUpload ? (
              <Link to="/" className="btn btn-secondary btn-sm">
                닫기
              </Link>
            ) : (
              <Link to="/upload" className="btn btn-primary btn-sm">
                + 업로드
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="wrap footer-inner">
          <span className="caption">mystudy — 학습 기록 아카이브</span>
          <span className="caption">스킬로 만든 HTML을 토픽별로 보관</span>
        </div>
      </footer>
    </>
  );
}

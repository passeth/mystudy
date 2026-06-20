import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="wrap section">
      <span className="eyebrow">404</span>
      <h1 className="display-lg" style={{ margin: "12px 0 20px" }}>
        페이지를 찾을 수 없습니다.
      </h1>
      <Link to="/" className="btn btn-primary">
        아카이브로 돌아가기
      </Link>
    </div>
  );
}

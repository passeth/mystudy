import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useManifest, findTopic } from "../lib/manifest";
import { isDark } from "../lib/types";

export default function Topic() {
  const { topicId = "" } = useParams();
  const { data, loading } = useManifest();
  const topic = findTopic(data, topicId);

  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function del(lessonId: string, title: string) {
    if (!window.confirm(`"${title}"\n\n이 레슨을 삭제할까요? 되돌릴 수 없습니다.`))
      return;
    setBusy(lessonId);
    setNotice(null);
    try {
      const r = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, lessonId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `삭제 실패 (${r.status})`);
      setRemoved((s) => new Set(s).add(lessonId));
      setNotice(
        "삭제 완료. 재배포가 끝나면(30~60초) 목록에서도 완전히 사라집니다."
      );
    } catch (e: any) {
      setNotice("오류: " + (e.message || String(e)));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="wrap section">
        <div className="skeleton" style={{ height: 180, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="wrap section">
        <div className="empty">
          토픽을 찾을 수 없습니다. <Link to="/">아카이브로</Link>
        </div>
      </div>
    );
  }

  const visible = topic.lessons.filter((l) => !removed.has(l.id));

  return (
    <div className="wrap section">
      <Link to="/" className="btn btn-ghost btn-sm" style={{ marginLeft: -12 }}>
        아카이브
      </Link>

      <div
        className={`topic-banner bg-${topic.color}${
          isDark(topic.color) ? " on-dark" : ""
        }`}
      >
        <span className="caption">
          {topic.id.toUpperCase()} · {visible.length} LESSONS
        </span>
        <h1>{topic.title}</h1>
        <p>{topic.subtitle}</p>
      </div>

      {notice && (
        <div
          className={`notice ${notice.startsWith("오류:") ? "err" : "ok"}`}
          style={{ marginBottom: 16 }}
        >
          {notice}
        </div>
      )}

      <div className="lesson-list">
        {visible.map((l, i) => (
          <div key={l.id} className="lesson-row">
            <Link to={`/t/${topic.id}/${l.id}`} className="lesson-link">
              <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="l-body">
                <span className="l-title">{l.title}</span>
                {l.subtitle && <span className="l-sub">{l.subtitle}</span>}
              </span>
            </Link>
            <button
              className="l-del"
              title="레슨 삭제"
              aria-label={`${l.title} 삭제`}
              disabled={busy === l.id}
              onClick={() => del(l.id, l.title)}
            >
              {busy === l.id ? "처리" : "삭제"}
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="empty">이 토픽에는 표시할 레슨이 없습니다.</div>
        )}
      </div>
    </div>
  );
}

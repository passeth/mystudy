import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useManifest } from "../lib/manifest";
import { BLOCK_COLORS, COLOR_HEX, type BlockColor } from "../lib/types";

type Mode = "existing" | "new";
type Source = "paste" | "file";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

export default function Upload() {
  const { data } = useManifest();
  const topics = data?.topics ?? [];

  const [mode, setMode] = useState<Mode>(topics.length ? "existing" : "new");
  const [existingId, setExistingId] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newColor, setNewColor] = useState<BlockColor>("lime");

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSubtitle, setLessonSubtitle] = useState("");

  const [source, setSource] = useState<Source>("paste");
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    null | { ok: boolean; msg: string; topicId?: string }
  >(null);

  const effectiveTopicId = useMemo(() => {
    if (mode === "existing") return existingId || topics[0]?.id || "";
    return slugify(newTitle);
  }, [mode, existingId, newTitle, topics]);

  const canSubmit =
    !!lessonTitle.trim() &&
    !!html.trim() &&
    (mode === "existing"
      ? !!(existingId || topics[0]?.id)
      : !!newTitle.trim());

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    setHtml(text);
    if (!lessonTitle) {
      const m = text.match(/<title>([^<]*)<\/title>/i);
      if (m) setLessonTitle(m[1].trim());
    }
  }

  async function submit() {
    setSubmitting(true);
    setResult(null);
    try {
      const body = {
        mode,
        topic:
          mode === "existing"
            ? { id: existingId || topics[0]?.id }
            : {
                id: slugify(newTitle),
                title: newTitle.trim(),
                subtitle: newSubtitle.trim(),
                color: newColor,
              },
        lesson: {
          title: lessonTitle.trim(),
          subtitle: lessonSubtitle.trim(),
        },
        html,
      };
      const r = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `업로드 실패 (${r.status})`);
      setResult({
        ok: true,
        topicId: j.topicId,
        msg: "커밋 완료! Vercel이 재배포되는 데 30~60초 정도 걸립니다. 잠시 후 새로고침하면 보입니다.",
      });
      setHtml("");
      setFileName("");
      setLessonTitle("");
      setLessonSubtitle("");
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap section">
      <span className="eyebrow">UPLOAD</span>
      <h1 className="display-lg" style={{ margin: "12px 0 8px" }}>
        학습 HTML 올리기
      </h1>
      <p className="muted" style={{ marginBottom: 32, maxWidth: "60ch" }}>
        스킬로 만든 HTML 한 편을 토픽에 추가합니다. 기존 토픽을 고르거나 새
        토픽을 만들 수 있어요. 올리면 GitHub에 커밋되고 자동 재배포됩니다.
      </p>

      <div className="form-card">
        {result && (
          <div className={`notice ${result.ok ? "ok" : "err"}`}>
            {result.msg}
            {result.ok && result.topicId && (
              <>
                {" "}
                <Link to={`/t/${result.topicId}`}>토픽 보기 →</Link>
              </>
            )}
          </div>
        )}

        {/* topic selection */}
        <div className="field">
          <label>토픽</label>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button
              className={mode === "existing" ? "active" : ""}
              onClick={() => setMode("existing")}
              type="button"
              disabled={!topics.length}
            >
              기존 토픽
            </button>
            <button
              className={mode === "new" ? "active" : ""}
              onClick={() => setMode("new")}
              type="button"
            >
              새 토픽 만들기
            </button>
          </div>

          {mode === "existing" ? (
            <select
              className="select"
              value={existingId || topics[0]?.id || ""}
              onChange={(e) => setExistingId(e.target.value)}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.lessons.length})
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="row2">
                <div>
                  <input
                    className="input"
                    placeholder="토픽 이름 (예: GDPR 기초)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  {newTitle && (
                    <div className="hint">id: {slugify(newTitle) || "—"}</div>
                  )}
                </div>
                <input
                  className="input"
                  placeholder="한 줄 설명 (선택)"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>
              <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
                <label>컬러</label>
                <div className="swatch-pick">
                  {BLOCK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      className={newColor === c ? "active" : ""}
                      style={{ background: COLOR_HEX[c] }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* lesson meta */}
        <div className="row2">
          <div className="field">
            <label>레슨 제목 *</label>
            <input
              className="input"
              placeholder="예: Lesson 0001 — 핵심 개념"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label>부제 (선택)</label>
            <input
              className="input"
              placeholder="한 줄 요약"
              value={lessonSubtitle}
              onChange={(e) => setLessonSubtitle(e.target.value)}
            />
          </div>
        </div>

        {/* html source */}
        <div className="field">
          <label>HTML</label>
          <div className="seg" style={{ marginBottom: 14 }}>
            <button
              className={source === "paste" ? "active" : ""}
              onClick={() => setSource("paste")}
              type="button"
            >
              붙여넣기
            </button>
            <button
              className={source === "file" ? "active" : ""}
              onClick={() => setSource("file")}
              type="button"
            >
              파일 선택
            </button>
          </div>

          {source === "paste" ? (
            <textarea
              className="textarea"
              placeholder="<!DOCTYPE html> ... 전체 HTML을 붙여넣으세요"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
          ) : (
            <div>
              <input
                type="file"
                accept=".html,text/html"
                onChange={onFile}
              />
              {fileName && (
                <div className="hint">
                  {fileName} · {Math.round(html.length / 1024)} KB 로드됨
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={!canSubmit || submitting}
          onClick={submit}
          type="button"
        >
          {submitting ? (
            <>
              <span className="spinner" /> 업로드 중…
            </>
          ) : (
            `${effectiveTopicId || "토픽"}에 추가`
          )}
        </button>
      </div>
    </div>
  );
}

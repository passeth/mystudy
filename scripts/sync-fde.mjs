#!/usr/bin/env node
/**
 * Claude FDE 스터디 동기화 스크립트.
 *
 *   npm run fde:sync                 # 봇 원본 폴더 → 스냅샷 복사 → HTML 생성
 *   npm run fde:sync -- --src <dir>  # 다른 원본 폴더(study/ 또는 study/course/)
 *   npm run fde:render               # 스냅샷(claude-fde-course/source)만으로 HTML 다시 생성
 *
 * 흐름
 *   <src>/course/README.md, sNN-*.md   ──import──▶  claude-fde-course/source/   (커밋되는 스냅샷)
 *   <src>/course/img/<poster>          ──import──▶  public/lessons/claude-fde/img/
 *   claude-fde-course/source + overview.md + fde.config.json
 *                                       ──render──▶  public/lessons/claude-fde/*.html
 *
 * 원본 폴더는 읽기만 해요. _official-outline-*.txt, _template.md, classroom.html,
 * 영상 파일(mp4)은 가져오지 않아요. 영상은 외부에 올린 뒤 fde.config.json의
 * sessions.SNN.video 에 URL을 적어요(mp4 직접 링크 또는 YouTube 링크).
 *
 * 의존성 없음(Node 18+). Markdown 변환기는 이 노트 형식에 필요한 만큼만 구현했어요.
 */
import {
  readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync, rmSync, statSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const courseDir = join(root, "claude-fde-course");
const snapshotDir = join(courseDir, "source");
const configFile = join(courseDir, "fde.config.json");
const overviewFile = join(courseDir, "overview.md");
const TOPIC = "claude-fde";
const outDir = join(root, "public", "lessons", TOPIC);
const HOME_ID = "0000-course-home";

const args = process.argv.slice(2);
const renderOnly = args.includes("--render-only");
const srcArgIdx = args.indexOf("--src");
const config = JSON.parse(readFileSync(configFile, "utf8"));
const OFFICIAL_URL = config.officialPathUrl;

// ---------------------------------------------------------------- import

function resolveSrc() {
  const raw = srcArgIdx >= 0 ? args[srcArgIdx + 1] : process.env.FDE_SRC || config.source;
  if (!raw) throw new Error("원본 폴더를 알 수 없어요. --src <dir> 를 주세요.");
  const courseSrc = existsSync(join(raw, "course", "README.md")) ? join(raw, "course") : raw;
  if (!existsSync(join(courseSrc, "README.md"))) {
    throw new Error(`원본 폴더에 README.md가 없어요: ${courseSrc}`);
  }
  return { courseSrc, videoSrc: join(dirname(courseSrc), "video") };
}

function importFromSource() {
  const { courseSrc, videoSrc } = resolveSrc();
  mkdirSync(snapshotDir, { recursive: true });
  const wanted = readdirSync(courseSrc).filter(
    (f) => f === "README.md" || /^s\d{2}-.*\.md$/.test(f)
  );
  // 원본에서 사라진 노트는 스냅샷에서도 지운다
  for (const f of readdirSync(snapshotDir)) {
    if (f.endsWith(".md") && !wanted.includes(f)) rmSync(join(snapshotDir, f));
  }
  for (const f of wanted) copyFileSync(join(courseSrc, f), join(snapshotDir, f));

  const images = new Set(
    [config.courseImage, ...Object.values(config.sessions || {}).map((s) => s.poster)].filter(Boolean)
  );
  mkdirSync(join(outDir, "img"), { recursive: true });
  for (const rel of images) {
    const from = join(courseSrc, rel);
    if (!existsSync(from)) {
      console.warn(`! 이미지 없음: ${from}`);
      continue;
    }
    const size = statSync(from).size;
    if (size > 1024 * 1024) {
      console.warn(`! ${rel} 은 ${(size / 1048576).toFixed(1)}MB라 건너뛰어요(1MB 이하만 복사).`);
      continue;
    }
    copyFileSync(from, join(outDir, "img", basename(rel)));
  }

  const videos = existsSync(videoSrc)
    ? readdirSync(videoSrc).filter((f) => /^s\d{2}\.mp4$/i.test(f))
    : [];
  console.log(`✓ import: ${wanted.length}개 파일 → claude-fde-course/source/`);
  return videos.map((f) => "S" + f.slice(1, 3));
}

// ---------------------------------------------------------------- markdown

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CHECK_RE = /확인 필요/g;
const CHECK_BADGE = '<span class="check" title="원본 노트에 (확인 필요)로 표시된 내용">확인 필요</span>';

function inline(raw) {
  const slots = [];
  const hold = (html) => `\u0000${slots.push(html) - 1}\u0000`;
  let t = esc(raw);
  t = t.replace(/`([^`]+)`/g, (_m, c) => hold(`<code>${c.replace(CHECK_RE, CHECK_BADGE)}</code>`));
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) =>
    hold(`<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`)
  );
  t = t.replace(/https?:\/\/[^\s<>"\u0000]+/g, (url) => {
    let u = url;
    let tail = "";
    while (/[.,;:!?)\]]$/.test(u)) {
      if (u.endsWith(")") && (u.match(/\(/g) || []).length >= (u.match(/\)/g) || []).length) break;
      tail = u.slice(-1) + tail;
      u = u.slice(0, -1);
    }
    return hold(`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`) + tail;
  });
  t = t.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  t = t.replace(CHECK_RE, CHECK_BADGE);
  t = t.replace(/\u0000(\d+)\u0000/g, (_m, n) => slots[Number(n)]);
  return t;
}

const indentOf = (l) => l.match(/^ */)[0].length;
const isBlank = (l) => /^\s*$/.test(l);
const FENCE_RE = /^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*$/;
const HEAD_RE = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR_RE = /^ {0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE_RE = /^ {0,3}>/;
const LIST_RE = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);
const splitRow = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function startsBlock(lines, i) {
  const l = lines[i];
  return (
    FENCE_RE.test(l) || HEAD_RE.test(l) || HR_RE.test(l) || QUOTE_RE.test(l) || LIST_RE.test(l) ||
    (l.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))
  );
}

/** Collect one list starting at lines[i]. Returns { ordered, start, items: string[][], next }. */
function collectList(lines, i) {
  const first = lines[i].match(LIST_RE);
  const base = first[1].length;
  const ordered = /\d/.test(first[2]);
  const start = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  while (i < lines.length) {
    const m = lines[i].match(LIST_RE);
    if (!m || m[1].length !== base || /\d/.test(m[2]) !== ordered) break;
    const contentIndent = base + m[2].length + 1;
    const body = [m[3]];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (isBlank(l)) {
        let j = i;
        while (j < lines.length && isBlank(lines[j])) j++;
        if (j < lines.length && indentOf(lines[j]) > base) {
          for (; i < j; i++) body.push("");
          continue;
        }
        break;
      }
      const ind = indentOf(l);
      if (ind > base) {
        body.push(l.slice(Math.min(ind, contentIndent)));
        i++;
        continue;
      }
      const sib = l.match(LIST_RE);
      if (sib || startsBlock(lines, i)) break;
      body.push(l.trimStart()); // lazy continuation
      i++;
    }
    items.push(body);
    // 빈 줄 뒤에 같은 목록이 이어지면 계속
    let j = i;
    while (j < lines.length && isBlank(lines[j])) j++;
    const nm = j < lines.length && lines[j].match(LIST_RE);
    if (nm && nm[1].length === base && /\d/.test(nm[2]) === ordered) i = j;
    else break;
  }
  return { ordered, start, items, next: i };
}

function renderBlocks(lines, opts = {}) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const pad = fence[1].length;
      const lang = fence[3];
      const buf = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s*${fence[2][0]}{${fence[2].length},}\\s*$`).test(lines[i])) {
        buf.push(lines[i].slice(Math.min(pad, indentOf(lines[i]))));
        i++;
      }
      i++;
      const code = esc(buf.join("\n")).replace(CHECK_RE, '<mark class="check-code">확인 필요</mark>');
      out.push(`<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${code}</code></pre>`);
      continue;
    }

    const h = line.match(HEAD_RE);
    if (h) {
      const level = Math.min(6, h[1].length + (opts.shift || 0));
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    if (HR_RE.test(line)) { out.push("<hr>"); i++; continue; }

    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && !isBlank(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(
        `<div class="table-scroll"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          `</tbody></table></div>`
      );
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const buf = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) buf.push(lines[i++].replace(/^ {0,3}> ?/, ""));
      out.push(`<blockquote>${renderBlocks(buf)}</blockquote>`);
      continue;
    }

    if (LIST_RE.test(line)) {
      const list = collectList(lines, i);
      i = list.next;
      out.push(renderList(list));
      continue;
    }

    const buf = [];
    while (i < lines.length && !isBlank(lines[i]) && (buf.length === 0 || !startsBlock(lines, i))) {
      buf.push(lines[i].trim());
      i++;
    }
    const text = buf.map(inline).join("<br>");
    out.push(opts.tight ? text : `<p>${text}</p>`);
  }
  return out.join("\n");
}

function renderItem(body) {
  const tight = !body.some(isBlank);
  return renderBlocks(body, { tight });
}

function renderList({ ordered, start, items }) {
  const tag = ordered ? "ol" : "ul";
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
  return `<${tag}${startAttr}>${items.map((b) => `<li>${renderItem(b)}</li>`).join("")}</${tag}>`;
}

// ---------------------------------------------------------------- notes

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2];
    let comment = "";
    const hash = value.search(/\s+#\s/);
    if (hash >= 0) {
      comment = value.slice(hash).replace(/^\s+#\s*/, "");
      value = value.slice(0, hash);
    }
    value = value.trim();
    if (/^\[.*\]$/.test(value)) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, "")); }
    } else value = value.replace(/^"(.*)"$/, "$1");
    meta[kv[1]] = value;
    if (comment) meta[`${kv[1]}_comment`] = comment;
  }
  return { meta, body: text.slice(m[0].length) };
}

/** Split body into h1 / preamble / ## sections, ignoring headings inside fences. */
function splitSections(body) {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let title = "";
  const pre = [];
  const sections = [];
  let cur = null;
  let fence = null;
  for (const line of lines) {
    const f = line.match(FENCE_RE);
    if (f) {
      if (!fence) fence = f[2][0];
      else if (line.trim().startsWith(fence)) fence = null;
    }
    if (!fence && !f) {
      const h1 = line.match(/^#\s+(.*)$/);
      if (h1 && !title && !cur) { title = h1[1].trim(); continue; }
      const h2 = line.match(/^##\s+(.*)$/);
      if (h2) { cur = { title: h2[1].trim(), lines: [] }; sections.push(cur); continue; }
    }
    (cur ? cur.lines : pre).push(line);
  }
  return { title, pre, sections };
}

/** Top-level ordered list with the lines before (lead) and after (tail) it. */
function topOrderedItems(lines) {
  let i = 0;
  const lead = [];
  while (i < lines.length && !LIST_RE.test(lines[i])) lead.push(lines[i++]);
  if (i >= lines.length) return null;
  const m = lines[i].match(LIST_RE);
  if (m[1].length !== 0 || !/\d/.test(m[2])) return null;
  const list = collectList(lines, i);
  const tail = lines.slice(list.next);
  return { lead, tail, items: list.items.map((b, k) => ({ num: list.start + k, body: b })) };
}

const countChecks = (text) => (text.match(CHECK_RE) || []).length;

function checkSentences(note) {
  // (확인 필요)가 있는 줄을 짧게 잘라 목록으로 만든다
  const out = [];
  for (const line of note.raw.split("\n")) {
    if (!line.includes("확인 필요")) continue;
    let t = line.replace(/^\s*([-*+]|\d+\.)\s+/, "").replace(/^>\s*/, "").replace(/^\w+:\s*/, (m) => (m.startsWith("official") ? "" : m)).trim();
    t = t.replace(/\*\*/g, "").replace(/`/g, "");
    const idx = t.indexOf("확인 필요");
    if (t.length > 180) {
      const from = Math.max(0, idx - 120);
      t = (from > 0 ? "… " : "") + t.slice(from, idx + 60) + (idx + 60 < t.length ? " …" : "");
    }
    out.push(t);
  }
  return out;
}

const STATUS_LABEL = { draft: "노트 초안", review: "검토 중", done: "완성", final: "완성" };

// ---------------------------------------------------------------- course table (README)

function parseCurriculum(readme) {
  const courses = [];
  let cur = null;
  for (const line of readme.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = splitRow(line);
    const head = cells[0].match(/^\*\*(.+?)\*\*\s*(?:\((.+)\))?$/);
    if (head && cells.slice(1).every((c) => !c)) {
      const [, name, detail = ""] = head;
      cur = { name, detail, sessions: [] };
      courses.push(cur);
      continue;
    }
    const row = cells[0].match(/^S(\d{2})$/);
    if (row && cur) {
      cur.sessions.push({ id: `S${row[1]}`, course: cells[1], topic: cells[2], file: cells[3].replace(/`/g, "") });
    }
  }
  return courses;
}

// ---------------------------------------------------------------- page shell

function disclaimer() {
  return `<footer class="disclaimer" role="note">
  <strong>비공식 학습 자료</strong>
  <p>이 노트는 Anthropic 공식 “Claude Forward Deployed Engineer” 학습 경로의 공개 개요와 공식 문서를 바탕으로 쓴 개인 학습 노트이며, 공식 강의 필기가 아니에요. 실제 강의·퀴즈·수료는 공식 경로에서 진행해요.</p>
  <p>공식 경로: <a href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">${OFFICIAL_URL}</a></p>
</footer>`;
}

function page({ title, description, body, sessionId = "" }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(description)}">
<title>${esc(title)}</title>
<link rel="stylesheet" href="fde.css">
</head>
<body${sessionId ? ` data-session="${sessionId}"` : ""}>
<!-- 자동 생성 파일: scripts/sync-fde.mjs 가 만들어요. 직접 고치지 말고 원본 노트를 고친 뒤 npm run fde:sync 하세요. -->
<main class="wrap">
${body}
${disclaimer()}
</main>
<script src="fde.js"></script>
</body>
</html>
`;
}

const sessionHref = (n) => `/t/${TOPIC}/${n.slug}`;
const link = (href, html, cls = "") => `<a href="${href}" target="_top"${cls ? ` class="${cls}"` : ""}>${html}</a>`;

function videoBlock(n) {
  const v = n.video;
  if (!v) return "";
  let player;
  if (v.url) {
    const yt = v.url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    player = yt
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="${esc(n.id)} 강의 영상" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`
      : `<video controls playsinline preload="metadata" src="${esc(v.url)}"${v.poster ? ` poster="img/${esc(v.poster)}"` : ""}></video>`;
  } else {
    player = `<div class="video-placeholder"${v.poster ? ` style="background-image:url('img/${esc(v.poster)}')"` : ""}>
      <div class="video-placeholder-text"><span class="pill">영상 준비 중</span><p>${esc(v.note || "이 세션의 영상은 아직 연결되지 않았어요.")}</p></div>
    </div>`;
  }
  return `<section class="player" aria-label="강의 영상">${player}</section>`;
}

// ---------------------------------------------------------------- session page

function renderSession(n, all, idx) {
  const { meta, sections, pre } = n;
  const byTitle = new Map(sections.map((s) => [s.title, s]));
  const questions = byTitle.get("확인 문제");
  const answers = byTitle.get("정답과 해설");
  const cardsSec = byTitle.get("복습 카드");
  const scriptSec = byTitle.get("영상 대본");

  let paired = null;
  if (questions && answers) {
    const q = topOrderedItems(questions.lines);
    const a = topOrderedItems(answers.lines);
    if (q && a && !a.lead.some((l) => !isBlank(l)) && q.items.length === a.items.length &&
        q.items.every((it, k) => it.num === a.items[k].num)) {
      paired = { q, a };
    }
  }

  const sec = (cls, title, inner, extra = "") =>
    `<section class="sec ${cls}"${extra}><h2>${inline(title)}</h2>${inner}</section>`;

  const scriptHtml = scriptSec
    ? `<details class="script"><summary>영상 대본 펼치기 <span class="muted">· 장면별 화면과 내레이션</span></summary><div class="script-body">${renderBlocks(scriptSec.lines, { shift: 1 })}</div></details>`
    : "";

  const parts = [];
  for (const s of sections) {
    const t = s.title;
    if (t === "정답과 해설" && paired) continue;
    if (t === "영상 대본") {
      if (!n.video) parts.push(sec("sec-script", t, scriptHtml));
      continue;
    }
    if (t === "확인 문제") {
      if (paired) {
        const items = paired.q.items.map((it, k) => {
          const ans = paired.a.items[k];
          return `<li value="${it.num}" class="q"><div class="q-body">${renderItem(it.body)}</div>
<details class="answer"><summary>정답과 해설 보기</summary><div class="answer-body">${renderItem(ans.body)}</div></details></li>`;
        });
        const rest = paired.a.tail.some((l) => !isBlank(l))
          ? `<details class="answer answer-all"><summary>나머지 해설 보기</summary><div class="answer-body">${renderBlocks(paired.a.tail)}</div></details>`
          : "";
        parts.push(sec("sec-quiz", t, `${renderBlocks(paired.q.lead)}<ol class="quiz">${items.join("\n")}</ol>${renderBlocks(paired.q.tail)}${rest}`));
      } else {
        parts.push(sec("sec-quiz", t, renderBlocks(s.lines)));
      }
      continue;
    }
    if (t === "정답과 해설") {
      parts.push(sec("sec-answers", t, `<details class="answer answer-all"><summary>정답과 해설 펼치기</summary><div class="answer-body">${renderBlocks(s.lines)}</div></details>`));
      continue;
    }
    if (t === "복습 카드") {
      const lines = s.lines.filter((l) => !isBlank(l));
      const cards = lines.map((l) => l.match(/^\s*[-*]\s+Q:\s*(.+?)\s+\/\s+A:\s*(.+)$/));
      if (cards.length && cards.every(Boolean)) {
        parts.push(sec("sec-cards", t,
          `<div class="cards">${cards.map((c) => `<details class="card"><summary>${inline(c[1])}</summary><div class="card-a">${inline(c[2])}</div></details>`).join("")}</div>`));
      } else {
        parts.push(sec("sec-cards", t, renderBlocks(s.lines)));
      }
      continue;
    }
    const cls = t.startsWith("직접 해 보기") ? "sec-try callout warm"
      : t === "FDE 관점" ? "sec-fde callout cool"
      : t === "출처" ? "sec-sources"
      : t === "오늘의 목표" ? "sec-goals"
      : "";
    parts.push(sec(cls, t, renderBlocks(s.lines, { shift: 0 })));
  }

  const prev = all[idx - 1];
  const next = all[idx + 1];
  const official = Array.isArray(meta.official_sections) ? meta.official_sections.join(" · ") : meta.official_sections || "";
  const chips = [
    meta.minutes ? `<span>${esc(meta.minutes)}분</span>` : "",
    `<span class="pill ${meta.status === "draft" ? "pill-draft" : "pill-ok"}">${esc(STATUS_LABEL[meta.status] || meta.status || "")}</span>`,
    n.video?.url ? `<span class="pill pill-ok">영상 + 노트</span>` : n.video ? `<span class="pill">영상 준비 중</span>` : "",
    n.checks ? `<span class="pill pill-check">확인 필요 ${n.checks}곳</span>` : "",
  ].filter(Boolean).join("");

  const body = `
<nav class="crumbs">${link(`/t/${TOPIC}/${HOME_ID}`, "← 코스 홈")}<span>${esc(n.courseName || meta.course || "")}</span></nav>
<header class="head">
  <span class="eyebrow">Claude FDE 스터디 · 세션 ${idx + 1} / ${all.length}</span>
  <h1>${inline(n.title)}</h1>
  <div class="meta">${chips}</div>
  ${official ? `<p class="official">공식 경로에서 해당하는 부분: ${inline(official)}${meta.official_sections_comment ? ` <span class="muted">— ${inline(meta.official_sections_comment)}</span>` : ""}</p>` : ""}
</header>
${n.video ? videoBlock(n) + (scriptHtml ? `<div class="under-video">${scriptHtml}</div>` : "") : ""}
${pre.some((l) => !isBlank(l)) ? `<div class="preamble">${renderBlocks(pre)}</div>` : ""}
<article class="note">
${parts.join("\n")}
</article>
<section class="done-box">
  <label><input type="checkbox" data-done="${n.id}"> 이 세션을 다 했어요 <span class="muted">(이 브라우저에만 저장돼요)</span></label>
</section>
<nav class="pager">
  ${prev ? link(sessionHref(prev), `<small>이전</small><span>${esc(prev.id)} · ${esc(prev.short)}</span>`, "prev") : `<span></span>`}
  ${next ? link(sessionHref(next), `<small>다음</small><span>${esc(next.id)} · ${esc(next.short)}</span>`, "next") : link(`/t/${TOPIC}/${HOME_ID}`, `<small>끝</small><span>코스 홈으로</span>`, "next")}
</nav>`;

  return page({
    title: n.title,
    description: `${n.courseName || meta.course || ""} · ${meta.minutes ? meta.minutes + "분" : ""}`.trim(),
    body,
    sessionId: n.id,
  });
}

// ---------------------------------------------------------------- course home

function renderHome(courses, notes, overviewMd) {
  const byId = new Map(notes.map((n) => [n.id, n]));
  const total = notes.length;
  const first = notes[0];

  const toc = courses.map((c, ci) => {
    const rows = c.sessions.map((s) => {
      const n = byId.get(s.id);
      if (!n) return `<li class="row missing"><span class="sid">${s.id}</span><span class="stitle">${inline(s.topic)} <span class="muted">(노트 없음)</span></span></li>`;
      const tags = [
        `<span class="pill ${n.meta.status === "draft" ? "pill-draft" : "pill-ok"}">${esc(STATUS_LABEL[n.meta.status] || n.meta.status || "")}</span>`,
        n.video?.url ? `<span class="pill pill-ok">영상</span>` : n.video ? `<span class="pill">영상 준비 중</span>` : "",
        n.checks ? `<span class="pill pill-check" title="(확인 필요) 표시 ${n.checks}곳">확인 필요 ${n.checks}</span>` : "",
      ].filter(Boolean).join("");
      return `<li class="row" data-row="${n.id}">
  ${link(sessionHref(n), `<span class="sid">${n.id}</span><span class="stitle">${inline(s.topic)}</span>`, "row-link")}
  <span class="smin">${esc(n.meta.minutes || "")}분</span>
  <span class="stags">${tags}</span>
  <span class="sdone" data-done-mark="${n.id}" aria-label="완료 여부"></span>
</li>`;
    });
    return `<section class="course">
  <header class="course-head"><span class="cnum">${ci < 11 ? `C${ci + 1}` : "★"}</span><h3>${inline(c.name.replace(/^\d+\.\s*/, ""))}</h3><span class="cdetail">${esc(c.detail)} · ${c.sessions.length}세션</span></header>
  <ol class="rows">${rows.join("\n")}</ol>
</section>`;
  });

  const checkList = notes.filter((n) => n.checks).map((n) =>
    `<li>${link(sessionHref(n), `<strong>${n.id}</strong>`)} <ul>${checkSentences(n).map((t) => `<li>${inline(t)}</li>`).join("")}</ul></li>`
  );
  const totalChecks = notes.reduce((a, n) => a + n.checks, 0);

  const body = `
<header class="head home-head">
  <div class="home-text">
    <span class="eyebrow">Claude FDE 스터디 · 비공식 학습 노트</span>
    <h1>Claude Forward Deployed Engineer<br>스터디 코스</h1>
    <div class="meta"><span>11개 코스</span><span>${total}개 세션</span><span>세션당 15~25분</span><span class="pill pill-draft">모든 노트 초안</span></div>
  </div>
  ${config.courseImage ? `<img class="home-img" src="img/${esc(basename(config.courseImage))}" alt="펼친 공책 위에 나무 조각을 한 칸씩 이어 놓는 손 그림" width="380" height="345">` : ""}
</header>
<section class="sec overview">${renderBlocks(overviewMd.split("\n"))}</section>
<section class="progress" aria-label="진행 상태">
  <div class="progress-text"><strong>진행 상태</strong> <span data-progress-count>0</span> / ${total} 세션 완료 <span class="muted">· 이 브라우저에만 저장돼요. 세션 페이지 아래에서 체크해요.</span></div>
  <div class="bar"><i data-progress-bar style="width:0%"></i></div>
  <div class="progress-cta">${first ? link(sessionHref(first), `S01부터 시작하기 →`, "btn") : ""}<span data-progress-next></span></div>
</section>
<section class="sec toc">
  <h2>목차: 11개 코스 → ${total}개 세션</h2>
  ${toc.join("\n")}
</section>
<section class="sec checks">
  <h2>확인이 필요한 곳 <span class="pill pill-check">${totalChecks}곳</span></h2>
  <p class="muted">노트를 쓸 때 공식 강의 본문이나 실행 결과로 확인하지 못한 내용이에요. 원본 표시를 그대로 두고, 노트 안에서도 같은 배지로 보여요.</p>
  <details><summary>세션별 목록 펼치기 (${checkList.length}개 세션)</summary><ul class="check-list">${checkList.join("\n")}</ul></details>
</section>
<script>window.FDE_SESSIONS = ${JSON.stringify(notes.map((n) => ({ id: n.id, href: sessionHref(n), title: n.short })))};</script>`;

  return page({
    title: "Claude FDE 스터디 — 코스 홈",
    description: `11개 코스 → ${total}개 세션 목차, 진행 상태, 확인이 필요한 곳`,
    body,
  });
}

// ---------------------------------------------------------------- main

function main() {
  let localVideos = [];
  if (!renderOnly) localVideos = importFromSource();

  const readme = readFileSync(join(snapshotDir, "README.md"), "utf8");
  const courses = parseCurriculum(readme);
  const courseOf = new Map();
  courses.forEach((c) => c.sessions.forEach((s) => courseOf.set(s.id, { course: c, topic: s.topic })));

  const files = readdirSync(snapshotDir).filter((f) => /^s\d{2}-.*\.md$/.test(f)).sort();
  const notes = files.map((f) => {
    const raw = readFileSync(join(snapshotDir, f), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const { title, pre, sections } = splitSections(body);
    const id = meta.session || "S" + f.slice(1, 3);
    const cfg = (config.sessions || {})[id] || {};
    const hasLocal = localVideos.includes(id);
    const video = cfg.video
      ? { url: cfg.video, poster: cfg.poster && basename(cfg.poster) }
      : cfg.poster || cfg.videoNote || hasLocal
        ? { url: "", poster: cfg.poster && basename(cfg.poster), note: cfg.videoNote }
        : null;
    const c = courseOf.get(id);
    return {
      id, slug: f.replace(/\.md$/, ""), raw, meta, pre, sections,
      title: title || meta.title || id,
      short: c?.topic || meta.title || id,
      courseName: c ? c.course.name : meta.course,
      checks: countChecks(raw),
      video,
    };
  });

  for (const id of localVideos) {
    const cfg = (config.sessions || {})[id];
    if (!cfg?.video) console.log(`· ${id}: 원본에 영상 파일이 있어요. 외부에 올린 뒤 fde.config.json sessions.${id}.video 에 URL을 넣으면 붙어요.`);
  }

  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(outDir)) if (f.endsWith(".html")) rmSync(join(outDir, f));
  copyFileSync(join(courseDir, "assets", "fde.css"), join(outDir, "fde.css"));
  copyFileSync(join(courseDir, "assets", "fde.js"), join(outDir, "fde.js"));

  writeFileSync(join(outDir, `${HOME_ID}.html`), renderHome(courses, notes, readFileSync(overviewFile, "utf8")));
  notes.forEach((n, i) => writeFileSync(join(outDir, `${n.slug}.html`), renderSession(n, notes, i)));

  const checks = notes.reduce((a, n) => a + n.checks, 0);
  console.log(`✓ render: 코스 홈 + ${notes.length}개 세션 → public/lessons/${TOPIC}/ (확인 필요 ${checks}곳)`);
}

main();

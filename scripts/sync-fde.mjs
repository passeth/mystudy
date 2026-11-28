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
    [
      config.home?.hero,
      ...Object.values(config.sessions || {}).flatMap((s) => [s.poster, s.hero]),
    ].filter(Boolean)
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
// 표 행 나누기: \| 는 칸 구분이 아니라 글자 | 로 남긴다
const splitRow = (l) =>
  l.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));

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

// ---------------------------------------------------------------- stage (강의실 디자인)

// 벽이 어두우면 글자는 종이색, 밝으면 먹색
const DARK = new Set(["cobalt", "bottle", "ink", "tomato", "night"]);
const room = (wall, floor, line) =>
  `--wall:var(--${wall});--floor:var(--${floor});--text:var(--${DARK.has(wall) ? "paper" : "ink"})` +
  `;--serc:var(--${DARK.has(wall) ? "pink" : wall === "sky" ? "ink" : "cobalt"})${line ? `;--line:${line}` : ""}`;

// 코스마다 한 벌씩 돌려 쓰는 무대 색 (같은 시리즈, 다른 방)
const THEMES = [
  { video: "pink", zoom: "lilac", core: ["lilac", "bottle"], lab: ["butter", "tomato"], fde: ["mint", "tomato"], cards: "mustard" },
  { video: "butter", zoom: "butter", core: ["butter", "cobalt"], lab: ["sky", "tomato"], fde: ["pink", "bottle"], cards: "sky" },
  { video: "mint", zoom: "mint", core: ["mint", "bottle"], lab: ["pink", "cobalt"], fde: ["lilac", "cobalt"], cards: "pink" },
  { video: "sky", zoom: "pink", core: ["pink", "bottle"], lab: ["mint", "tomato"], fde: ["butter", "tomato"], cards: "lilac" },
  { video: "lilac", zoom: "sky", core: ["sky", "bottle"], lab: ["butter", "cobalt"], fde: ["purple", "bottle"], cards: "butter" },
  { video: "butter", zoom: "purple", core: ["purple", "cobalt"], lab: ["mint", "bottle"], fde: ["beige", "tomato"], cards: "mint" },
];
const CARD_BACKS = ["sky", "pink", "purple", "mint", "butter", "lilac"];
const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];

const stats = { auto: 0, essay: 0, folded: [], fallback: [] };

function disclaimerText() {
  return `<p><b>비공식 학습 자료.</b> 이 노트는 Anthropic 공식 “Claude Forward Deployed Engineer” 학습 경로의 공개 개요와 공식 문서를 바탕으로 쓴 개인 학습 노트이며, 공식 강의 필기가 아니에요. 실제 강의·퀴즈·수료는 공식 경로에서 진행해요.</p>
    <p>공식 경로: <a href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">${OFFICIAL_URL}</a></p>`;
}

function night(extra = "") {
  return `<footer class="night" role="contentinfo">
  <div class="inner">
    <p class="end">FDE <span class="ser">study</span><span class="dot end-dot" aria-hidden="true"></span></p>
    ${disclaimerText()}
    ${extra}
  </div>
</footer>`;
}

function page({ title, description, body, sessionId = "", data = null }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,700;12..96,800&family=Cutive+Mono&family=Gowun+Batang:wght@400;700&family=Instrument+Serif:ital@0;1&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap">
<link rel="stylesheet" href="fde.css">
</head>
<body${sessionId ? ` data-session="${sessionId}"` : ""}>
<!-- 자동 생성 파일: scripts/sync-fde.mjs 가 만들어요. 직접 고치지 말고 원본 노트나 claude-fde-course/ 를 고친 뒤 npm run fde:render 하세요. -->
${body}
${data ? `<script type="application/json" id="fde-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>` : ""}
<script src="fde.js"></script>
</body>
</html>
`;
}

const sessionHref = (n) => `/t/${TOPIC}/${n.slug}`;
// 슬라이드 강의(npm run fde:slides 로 public/slides/claude-fde/ 에 넣은 묶음). 묶음이 있는 세션만 버튼을 붙여요.
const slidesDir = join(root, "public", "slides", TOPIC);
const slideHref = (id) => `/slides/${TOPIC}/${id.toLowerCase()}/`;
const hasSlides = (id) => existsSync(join(slidesDir, id.toLowerCase(), "index.html"));
const homeHref = `/t/${TOPIC}/${HOME_ID}`;
const link = (href, html, cls = "") => `<a href="${href}" target="_top"${cls ? ` class="${cls}"` : ""}>${html}</a>`;
const mark = (text) => `<span class="mark"><b>##</b> ${text}</span>`;
const KNUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

/** `*단어*` 를 분홍 세리프 강조로 */
const accent = (text) => inline(text).replace(/<em>(.+?)<\/em>/g, '<span class="ser">$1</span>');

function hud(label, href) {
  return `<nav class="hud" aria-label="코스">
  ${link(homeHref, `Claude FDE 스터디 <span class="dot" aria-hidden="true"></span><span class="long">비공식 노트</span>`, "brand")}
  <a class="pill" href="${href}">${label} <i aria-hidden="true"></i></a>
</nav>`;
}

function videoUrl(url) {
  const yt = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  return yt ? { kind: "youtube", id: yt[1] } : { kind: "file", src: url };
}

// ---------------------------------------------------------------- zoom word

const JOSA = ["으로", "에서", "에게", "과", "와", "의", "은", "는", "이", "가", "을", "를", "로", "에", "도"];
const STOP = new Set(["가지", "다음", "하나", "무엇", "결정", "단계", "총정리", "만들기", "고르기", "보기", "하기", "쓰기", "이란", "그리고", "코스", "claude", "ai", "mode", "managed", "the"]);
const stem = (w) => {
  for (const j of JOSA) if (w.length - j.length >= 2 && w.endsWith(j)) return w.slice(0, -j.length);
  return w;
};

function pickZoom(n) {
  if (n.cfg.zoom) return n.cfg.zoom;
  const core = n.sections.find((s) => s.title === "핵심 정리");
  const text = `${n.title}\n${core ? core.lines.join("\n") : ""}`.toLowerCase();
  const cands = n.title.replace(/^S\d+\.\s*/, "")
    .split(/[\s:·,()\/+→“”"'?!.]+/).filter(Boolean).map(stem)
    .filter((w) => !STOP.has(w) && !STOP.has(w.toLowerCase()) && (/^[가-힣]{2,4}$/.test(w) || /^[A-Za-z][A-Za-z.-]{1,7}$/.test(w)));
  let best = "", score = -1;
  for (const w of cands) {
    const s = text.split(w.toLowerCase()).length - 1;
    if (s > score) { best = w; score = s; }
  }
  return best || "FDE";
}

function zoomSize(word) {
  const korean = /[가-힣]/.test(word);
  const vw = Math.min(30, (korean ? 62 : 92) / Math.max(1, word.length));
  return `font-size:clamp(${korean ? 4 : 3.5}rem, ${vw.toFixed(1)}vw, 26rem)`;
}

// ---------------------------------------------------------------- section helpers

const nonBlank = (lines) => lines.some((l) => !isBlank(l));

/** A section that is only one list → ticks; otherwise ordinary blocks. */
function ticksOrBlocks(lines) {
  const first = lines.findIndex((l) => !isBlank(l));
  if (first >= 0 && LIST_RE.test(lines[first]) && indentOf(lines[first]) === 0) {
    const list = collectList(lines, first);
    if (!nonBlank(lines.slice(list.next))) {
      return `<ul class="ticks">${list.items.map((b) => `<li>${renderItem(b)}</li>`).join("")}</ul>`;
    }
  }
  return `<div class="md">${renderBlocks(lines)}</div>`;
}

/** 핵심 정리 → lead + 말풍선 카드 (### 마다 한 장). Fence-aware. */
function splitSub(lines) {
  const lead = [];
  const subs = [];
  let cur = null;
  let fence = false;
  for (const l of lines) {
    if (FENCE_RE.test(l)) fence = !fence;
    const h = !fence && l.match(/^###\s+(.*)$/);
    if (h) { cur = { title: h[1].trim(), lines: [] }; subs.push(cur); continue; }
    (cur ? cur.lines : lead).push(l);
  }
  return { lead, subs };
}

const OPT_RE = /^\s*[-*+]\s+\(([a-h])\)\s*(.*)$/;

function quizItem(qi, ai, sid) {
  const opts = [];
  const qLines = [];
  for (const l of qi.body) {
    const m = l.match(OPT_RE);
    if (m) opts.push(m);
    else qLines.push(l);
  }
  const sequential = opts.length >= 2 && opts.every((m, k) => m[1] === "abcdefgh"[k]);
  const first = (ai.body[0] || "").trim();
  const am = first.match(/^\(([a-h])\)\.?(?:\s+|$)(.*)$/);
  const multi = am && /^[,와과및]|^\s*[,와과및]\s*\(/.test(am[2]);
  const qHtml = renderBlocks(qLines, { tight: true });
  const head = `<p class="qq"><span class="mono">Q${qi.num}</span>${qHtml}</p>`;

  if (sequential && am && !multi && "abcdefgh".indexOf(am[1]) < opts.length) {
    stats.auto++;
    const why = renderBlocks([am[2], ...ai.body.slice(1)], { tight: true });
    return `<div class="q" data-answer="${"abcdefgh".indexOf(am[1])}">${head}
  <div class="opts">${opts.map((m) => `<button class="opt" type="button">${inline(m[2])}</button>`).join("")}</div>
  <p class="why">${why}</p></div>`;
  }
  if (sequential || am) {
    stats.folded.push(`${sid} Q${qi.num}: ${sequential ? "보기는 있지만 정답 표기를 읽지 못함" : "정답 표기는 있지만 보기 목록을 읽지 못함"}`);
  } else {
    stats.essay++;
  }
  const optsHtml = opts.length ? `<ul class="opt-list">${opts.map((m) => `<li>(${m[1]}) ${inline(m[2])}</li>`).join("")}</ul>` : "";
  const body = [...ai.body];
  body[0] = (body[0] || "").replace(/^예시 답\s*:\s*/, "");
  return `<div class="q">${head}${optsHtml}
  <details class="ans"><summary>${sequential || am ? "정답과 해설 보기" : "예시 답 보기"}</summary><div class="md">${renderItem(body)}</div></details></div>`;
}

function quizHtml(n) {
  const qs = n.sections.find((s) => s.title === "확인 문제");
  const as = n.sections.find((s) => s.title === "정답과 해설");
  if (!qs) return "";
  const q = topOrderedItems(qs.lines);
  const a = as && topOrderedItems(as.lines);
  const paired = q && a && !nonBlank(a.lead) && q.items.length === a.items.length &&
    q.items.every((it, k) => it.num === a.items[k].num);
  if (!paired) {
    stats.fallback.push(`${n.id}: 확인 문제와 정답의 번호 목록이 맞지 않아 전체를 접음`);
    return `<div class="block" id="quiz"><h2><span class="mono">##</span>확인 문제</h2>
  <div class="md">${renderBlocks(qs.lines)}</div>
  ${as ? `<details class="ans big"><summary>정답과 해설 펼치기</summary><div class="md">${renderBlocks(as.lines)}</div></details>` : ""}</div>`;
  }
  const items = q.items.map((it, k) => quizItem(it, a.items[k], n.id)).join("\n");
  const rest = nonBlank(a.tail)
    ? `<details class="ans"><summary>나머지 해설 보기</summary><div class="md">${renderBlocks(a.tail)}</div></details>` : "";
  const graded = /data-answer/.test(items);
  return `<div class="block quiz" id="quiz"><h2><span class="mono">##</span>확인 문제 ${graded ? `<span class="mono small">고르면 바로 채점</span>` : ""}</h2>
  ${nonBlank(q.lead) ? `<div class="md">${renderBlocks(q.lead)}</div>` : ""}
  ${items}
  ${nonBlank(q.tail) ? `<div class="md">${renderBlocks(q.tail)}</div>` : ""}
  ${rest}</div>`;
}

function ledger(courses, byId, currentId = "") {
  return `<div class="ledger">${courses.map((c, ci) => {
    const no = ci < 11 ? `${ci + 1}. ` : "";
    const rows = c.sessions.map((s) => {
      const n = byId.get(s.id);
      const tag = n?.video?.url ? `<span class="tag v">영상</span>` : `<span class="tag n">노트</span>`;
      const inner = `<span class="mono">${s.id}</span><span class="tt">${inline(s.topic)}</span>${tag}<span class="done-mark" data-done-mark="${s.id}" aria-hidden="true"></span>`;
      const cls = s.id === currentId ? "now" : "";
      const sl = hasSlides(s.id) ? link(slideHref(s.id), "슬라이드", "sl").replace("<a ", `<a aria-label="${s.id} 슬라이드로 보기" `) : "";
      return `<li class="${cls}${sl ? " has-sl" : ""}"${s.id === currentId ? ' aria-current="page"' : ""}>${n ? link(sessionHref(n), inner) : `<span class="row">${inner}</span>`}${sl}</li>`;
    }).join("");
    return `<div class="course rise"><h3><span>${no}${inline(c.name.replace(/^\d+\.\s*/, ""))}</span><span class="mono">${c.sessions.length}세션</span></h3>
  ${c.detail ? `<p class="cd mono">${esc(c.detail)}</p>` : ""}<ol>${rows}</ol></div>`;
  }).join("\n")}</div>`;
}

function labRoom(lab, theme, ix) {
  const [wall, floor] = theme.lab;
  return `<section class="room r-lab iris" style="${room(wall, floor, "74%")};--ix:${ix}%" aria-label="${esc(lab.title || "직접 뽑아 보기")}">
  <div class="inner">
    ${mark(esc(lab.mark || "직접 뽑아 보기"))}
    <h2 class="title">${accent(lab.title || "")}</h2>
    <div class="lab" data-lab>
      <div class="row" aria-live="polite">${(lab.prefix || []).map((w) => `<span class="block">${esc(w)}</span>`).join("")}<span class="block next" data-lab-next>?</span></div>
      <div class="dist">
        <div class="bars" data-lab-bars></div>
        <div class="go-row"><button class="go" type="button" data-lab-draw>한 번 뽑기</button><span class="tally" data-lab-tally>아직 뽑지 않았어요</span></div>
        ${lab.note ? `<span class="tally">${esc(lab.note)}</span>` : ""}
      </div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- session page

function renderSession(n, all, idx, courses) {
  const { meta } = n;
  const theme = THEMES[n.courseIdx % THEMES.length];
  const pos = n.posInCourse;
  const ixs = [50, 80, 20, 70, 30, 60].map((v) => (v + pos * 13) % 90 + 5);
  const sec = (t) => n.sections.find((s) => s.title === t || s.title.startsWith(t));
  const KNOWN = ["오늘의 목표", "핵심 정리", "직접 해 보기", "확인 문제", "정답과 해설", "FDE 관점", "복습 카드", "영상 대본", "출처"];
  const zoom = pickZoom(n);
  const titleText = n.title.replace(/^S\d+\.\s*/, "");
  const headline = n.cfg.headline
    ? accent(n.cfg.headline)
    : inline(titleText).replace(new RegExp(zoom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), (m) => `<span class="ser">${m}</span>`);
  const goals = sec("오늘의 목표");
  const qCount = (() => { const q = sec("확인 문제"); const t = q && topOrderedItems(q.lines); return t ? t.items.length : 0; })();
  const cardsSec = sec("복습 카드");
  const cardLines = cardsSec ? cardsSec.lines.filter((l) => !isBlank(l)) : [];
  const cards = cardLines.map((l) => l.match(/^\s*[-*]\s+Q:\s*(.+?)\s+\/\s+A:\s*(.+)$/));
  const scriptSec = sec("영상 대본");
  const scenes = scriptSec ? scriptSec.lines.filter((l) => /^###\s/.test(l)).length : 0;
  const courseNo = n.courseIdx < 11 ? `코스 ${n.courseIdx + 1}` : "캡스톤";
  const courseName = (n.courseName || meta.course || "").replace(/^\d+\.\s*/, "");

  const lines = n.cfg.lines || [
    goals && (() => { const f = goals.lines.find((l) => LIST_RE.test(l)); return f ? f.replace(LIST_RE, "$3") : ""; })(),
    [meta.minutes && `${meta.minutes}분`, qCount && `확인 문제 ${qCount}개`, cards.filter(Boolean).length && `복습 카드 ${cards.filter(Boolean).length}장`].filter(Boolean).join(" · "),
    n.checks ? `확인 필요 표시 ${n.checks}곳` : "노트 초안 · 비공식",
  ].filter(Boolean);

  // ---- hero
  const heroImg = n.cfg.hero;
  const heroCopy = `<div class="copy">
    ${mark(`${courseNo} · ${inline(courseName)}`).replace('class="mark"', 'class="mark land"')}
    <h1 class="land l2">${headline}</h1>
    <div class="lines land l3">${lines.map((l) => `<span>${inline(l)}</span>`).join("")}</div>
    <span class="by">${esc(n.id)} · ${inline(titleText)}</span>
  </div>`;
  const hero = heroImg
    ? `<header class="room hero">
  <div class="art"><img src="img/${esc(basename(heroImg))}" alt="${esc(n.cfg.heroAlt || "")}" width="1600" height="893"></div>
  ${heroCopy}
</header>`
    : `<header class="room hero type" style="${room("cobalt", "beige", "78%")}">
  ${heroCopy}
  <span class="numeral" aria-hidden="true">${esc(n.id.slice(1))}</span>
</header>`;

  // ---- video
  const v = n.video;
  let screen;
  if (v?.url) {
    const vu = videoUrl(v.url);
    screen = vu.kind === "youtube"
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${vu.id}?rel=0" title="${esc(n.id)} 강의 영상" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : `<video controls playsinline preload="metadata" src="${esc(vu.src)}"${v.poster ? ` poster="img/${esc(v.poster)}"` : ""}></video>`;
  } else {
    screen = `<div class="ph"${v?.poster ? ` style="background-image:url('img/${esc(v.poster)}')"` : ""}>
      ${v?.poster ? "" : `<span class="ph-id" aria-hidden="true">${esc(n.id)}</span>`}
      <span class="ph-pill">영상 준비 중</span>
    </div>`;
  }
  const scriptDetails = scriptSec
    ? `<details class="next"><summary>영상 대본 펼치기</summary><div class="script md">${renderBlocks(scriptSec.lines, { shift: 0 })}</div></details>` : "";
  const videoRoom = `<section class="room r-video iris" style="${room("ink", theme.video, "80%")};--ix:${ixs[0]}%" aria-labelledby="h-v">
  <div class="inner">
    ${mark("오늘의 강의")}
    <h2 id="h-v" class="title">${v?.url ? `먼저 보고, <span class="ser">아래에서</span> 확인해요` : `영상은 <span class="ser">준비 중</span>, 노트부터 봐요`}</h2>
    <div class="screen rise">${screen}</div>
    <div class="under"><span>${[meta.minutes && `${meta.minutes}분 세션`, scenes && `대본 장면 ${scenes}개`].filter(Boolean).join(" · ")}</span><span>${v?.url ? "영상 + 노트" : "노트 먼저"}</span></div>
    ${hasSlides(n.id) ? `<div class="go-row slide-row">${link(slideHref(n.id), `<span aria-hidden="true">▶</span> 슬라이드로 보기`, "go go-slide")}<span class="slide-hint">장면을 넘기며 같은 강의를 음성·자막으로</span></div>` : ""}
    ${scriptDetails}
  </div>
</section>`;

  // ---- zoom
  const coreWall = theme.core[0];
  const zoomRoom = `<section class="zoom" style="--zc:var(--${theme.zoom});--zfill:var(--${coreWall})" aria-label="핵심 단어: ${esc(zoom)}">
  <div class="stage"><span class="word" aria-hidden="true" style="${zoomSize(zoom)}">${esc(zoom)}</span><span class="cap">&gt; 글자 속으로 들어가 볼까요</span></div>
</section>`;

  // ---- core
  const core = sec("핵심 정리");
  let coreRoom = "";
  if (core) {
    const { lead, subs } = splitSub(core.lines);
    const bubbles = subs.length ? subs : [{ title: "", lines: core.lines }];
    const leadHtml = subs.length && nonBlank(lead) ? `<div class="lead md">${renderBlocks(lead)}</div>` : "";
    coreRoom = `<section class="room r-core" style="${room(theme.core[0], theme.core[1], "86%")}" aria-labelledby="h-core">
  <div class="inner">
    ${mark("핵심 정리")}
    <h2 id="h-core" class="title">${bubbles.length <= 10 ? `${KNUM[bubbles.length]} 장만 기억해요` : `${bubbles.length}장만 기억해요`}</h2>
    ${leadHtml}
    <div class="bubbles">${bubbles.map((b, k) => {
      const body = renderBlocks(b.lines);
      const wide = /<pre|<table|<blockquote/.test(body) || body.replace(/<[^>]+>/g, "").length > 900 ? " wide" : "";
      return `<article class="bubble rise${wide}"><span class="n">${String(k + 1).padStart(2, "0")}</span>${b.title ? `<h3>${inline(b.title)}</h3>` : ""}<div class="md">${body}</div></article>`;
    }).join("\n")}</div>
  </div>
</section>`;
  }

  // ---- note page: goals, try, quiz
  const tryS = sec("직접 해 보기");
  const tryLabel = tryS ? (tryS.title.match(/\(([^)]+)\)/) || [])[1] : "";
  const noteRoom = `<section class="room r-note iris" style="--ix:${ixs[2]}%" aria-label="노트">
  <div class="inner">
    <div class="page">
      ${goals ? `<div class="block"><h2><span class="mono">##</span>오늘의 목표</h2>${ticksOrBlocks(goals.lines)}</div>` : ""}
      ${tryS ? `<div class="block"><h2><span class="mono">##</span>직접 해 보기 ${tryLabel ? `<span class="mono small">${esc(tryLabel)}</span>` : ""}</h2>${ticksOrBlocks(tryS.lines)}</div>` : ""}
      ${quizHtml(n)}
    </div>
  </div>
</section>`;

  // ---- FDE
  const fde = sec("FDE 관점");
  let fdeRoom = "";
  if (fde) {
    const text = fde.lines.filter((l) => !isBlank(l));
    const firstPara = [];
    let i = 0;
    while (i < fde.lines.length && isBlank(fde.lines[i])) i++;
    while (i < fde.lines.length && !isBlank(fde.lines[i]) && !(firstPara.length && startsBlock(fde.lines, i))) firstPara.push(fde.lines[i++]);
    const para = firstPara.join(" ");
    const simple = text.length && !LIST_RE.test(firstPara[0] || "") && !FENCE_RE.test(firstPara[0] || "");
    let sayHtml = "", restLines = fde.lines;
    if (simple) {
      const m = para.match(/^(.+?[.?!])(\s+|$)([\s\S]*)$/);
      const lead = m ? m[1] : para;
      const after = m ? m[3] : "";
      sayHtml = inline(lead).replace(/(“[^”]{2,40}”|&quot;[^&]{2,40}&quot;)/, "<em>$1</em>");
      restLines = [after, ...fde.lines.slice(i)];
      const long = lead.length > 90 ? " sm" : "";
      sayHtml = `<h2 id="h-fde" class="say${long}">${sayHtml}</h2>`;
    }
    fdeRoom = `<section class="room r-fde band iris" style="${room(theme.fde[0], theme.fde[1], "76%")};--ix:${ixs[3]}%" aria-labelledby="h-fde">
  <div class="inner">
    ${mark("FDE 관점")}
    ${sayHtml || `<h2 id="h-fde" class="title">FDE는 이렇게 써요</h2>`}
    ${nonBlank(restLines) ? `<div class="lead md">${renderBlocks(restLines)}</div>` : ""}
  </div>
</section>`;
  }

  // ---- cards
  let cardsRoom = "";
  if (cardsSec) {
    const ok = cards.length && cards.every(Boolean);
    const off = idx % CARD_BACKS.length;
    const inner = ok
      ? `<div class="cards">${cards.map((c, k) => `<button class="card" type="button" aria-pressed="false" style="--r:${TILTS[(k + idx) % TILTS.length]}deg"><span class="face front"><span class="no">${String(k + 1).padStart(2, "0")}</span><b>${inline(c[1])}</b><span class="flip mono">눌러서 뒤집기</span></span><span class="face back" style="--bg:var(--${CARD_BACKS[(k + off) % CARD_BACKS.length]})">${inline(c[2])}</span></button>`).join("\n")}</div>`
      : `<div class="sheet md">${renderBlocks(cardsSec.lines)}</div>`;
    cardsRoom = `<section class="room r-cards iris" style="${room(theme.cards, theme.cards)};--ix:${ixs[4]}%" aria-labelledby="h-cards">
  <div class="inner">
    ${mark("복습 카드")}
    <h2 id="h-cards" class="title">${ok ? "눌러서 뒤집기" : "복습 카드"}</h2>
    ${inner}
  </div>
</section>`;
  }

  // ---- other sections and preamble (paper rooms)
  const extraRoom = (title, lines) => `<section class="room r-plain" aria-label="${esc(title)}">
  <div class="inner">${mark(inline(title))}<div class="sheet md">${renderBlocks(lines)}</div></div>
</section>`;
  const preRoom = nonBlank(n.pre) ? extraRoom("먼저 읽기", n.pre) : "";
  const extras = n.sections.filter((s) => !KNOWN.some((k) => s.title === k || s.title.startsWith(k)))
    .map((s) => extraRoom(s.title, s.lines)).join("\n");

  // ---- end: done + pager + timetable
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const byId = new Map(all.map((x) => [x.id, x]));
  const endRoom = `<section class="room r-tt iris" style="${room("cobalt", "cobalt")};--ix:${ixs[5]}%" id="timetable" aria-labelledby="h-tt">
  <div class="inner">
    <div class="endrow">
      <label class="done-box"><input type="checkbox" data-done="${n.id}"> 이 세션을 다 했어요 <span class="mono small">이 브라우저에만 저장</span></label>
      <nav class="pager" aria-label="세션 이동">
        ${prev ? link(sessionHref(prev), `← ${esc(prev.id)}`, "pg") : ""}
        ${link(homeHref, "코스 홈", "pg")}
        ${next ? link(sessionHref(next), `${esc(next.id)} · ${esc(next.short)} →`, "pg pg-next") : ""}
      </nav>
    </div>
    ${mark("전체 시간표")}
    <h2 id="h-tt" class="title">11개 코스, <span class="ser">${all.length}개</span> 세션</h2>
    ${ledger(courses, byId, n.id)}
  </div>
</section>`;

  const src = sec("출처");
  const srcHtml = src ? `<div class="sources"><p class="mono">## 출처</p><div class="md">${renderBlocks(src.lines)}</div></div>` : "";

  const lab = n.cfg.lab ? labRoom(n.cfg.lab, theme, ixs[1]) : "";

  const body = `${hud(`세션 ${esc(n.id.slice(1))} / ${all.length}`, "#timetable")}
<main>
${hero}
${preRoom}
${videoRoom}
${core ? zoomRoom : ""}
${coreRoom}
${lab}
${noteRoom}
${fdeRoom}
${cardsRoom}
${extras}
${endRoom}
</main>
${night(srcHtml)}`;

  return page({
    title: n.title,
    description: `${n.courseName || meta.course || ""} · ${meta.minutes ? meta.minutes + "분" : ""}`.trim(),
    body,
    sessionId: n.id,
    data: n.cfg.lab ? { lab: n.cfg.lab } : null,
  });
}

// ---------------------------------------------------------------- course home

function renderHome(courses, notes, overviewMd) {
  const byId = new Map(notes.map((n) => [n.id, n]));
  const total = notes.length;
  const first = notes[0];
  const home = config.home || {};
  const totalChecks = notes.reduce((a, n) => a + n.checks, 0);
  const checkList = notes.filter((n) => n.checks).map((n) =>
    `<li>${link(sessionHref(n), `<b>${n.id}</b> ${inline(n.short)}`)}<ul>${checkSentences(n).map((t) => `<li>${inline(t)}</li>`).join("")}</ul></li>`
  ).join("\n");

  const copy = `<div class="copy">
    ${mark(`비공식 학습 노트 · 11개 코스 · ${total}세션`).replace('class="mark"', 'class="mark land"')}
    <h1 class="land l2">${accent(home.headline || "Claude FDE *스터디*")}</h1>
    <div class="lines land l3">${(home.lines || ["11개 코스를 42개 세션으로", "하루 한 세션, 15~25분", "마지막엔 파일럿 계획서 한 장"]).map((l) => `<span>${inline(l)}</span>`).join("")}</div>
    ${first && hasSlides(first.id) ? `<div class="go-row land l3">${link(slideHref(first.id), `<span aria-hidden="true">▶</span> 슬라이드로 처음부터`, "go go-slide")}<span class="slide-hint">S01부터 장면을 넘기며 듣는 강의</span></div>` : ""}
    <span class="by">Claude Forward Deployed Engineer 학습 경로 · 개인 학습 노트</span>
  </div>`;
  const hero = home.hero
    ? `<header class="room hero">
  <div class="art"><img src="img/${esc(basename(home.hero))}" alt="${esc(home.heroAlt || "")}" width="1600" height="893"></div>
  ${copy}
</header>`
    : `<header class="room hero type" style="${room("cobalt", "beige", "78%")}">${copy}</header>`;

  const body = `${hud("시간표", "#timetable")}
<main>
${hero}
<section class="room r-note iris" style="--ix:30%" aria-label="코스 소개">
  <div class="inner"><div class="page">
    <div class="block"><h2><span class="mono">##</span>이 코스는</h2><div class="md">${renderBlocks(overviewMd.split("\n"), { shift: 0 })}</div></div>
  </div></div>
</section>
<section class="room r-progress iris" style="${room("butter", "tomato", "74%")};--ix:70%" aria-labelledby="h-prog">
  <div class="inner">
    ${mark("진도")}
    <h2 id="h-prog" class="title"><span data-progress-count>0</span> / ${total} <span class="ser">세션</span> 완료</h2>
    <div class="progress"><div class="bar-track"><i data-progress-bar style="width:0%"></i></div>
      <p class="mono small">이 브라우저에만 저장돼요. 세션 페이지 맨 아래에서 체크해요.</p>
      <div class="go-row">${first ? link(sessionHref(first), "S01부터 시작하기 →", "go") : ""}<span data-progress-next></span></div>
    </div>
  </div>
</section>
<section class="room r-tt iris" style="${room("cobalt", "cobalt")};--ix:50%" id="timetable" aria-labelledby="h-tt">
  <div class="inner">
    ${mark("전체 시간표")}
    <h2 id="h-tt" class="title">11개 코스, <span class="ser">${total}개</span> 세션</h2>
    ${ledger(courses, byId)}
  </div>
</section>
<section class="room r-plain" aria-labelledby="h-chk">
  <div class="inner">
    ${mark("확인이 필요한 곳")}
    <h2 id="h-chk" class="title">아직 <span class="ser">확인 필요</span> ${totalChecks}곳</h2>
    <p class="lead">공식 강의 본문이나 실행 결과로 확인하지 못한 내용이에요. 원본 표시를 그대로 두고, 노트 안에서도 같은 배지로 보여요.</p>
    <details class="next"><summary>세션별 목록 펼치기 (${notes.filter((n) => n.checks).length}개 세션)</summary><div class="sheet md"><ul class="check-list">${checkList}</ul></div></details>
  </div>
</section>
</main>
${night()}
<script>window.FDE_SESSIONS = ${JSON.stringify(notes.map((n) => ({ id: n.id, href: sessionHref(n), title: n.short })))};</script>`;

  return page({
    title: "Claude FDE 스터디 — 코스 홈",
    description: `11개 코스 → ${total}개 세션 시간표, 진도, 확인이 필요한 곳`,
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
  courses.forEach((c, ci) => c.sessions.forEach((s, si) => courseOf.set(s.id, { course: c, ci, si, topic: s.topic })));

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
      : { url: "", poster: cfg.poster && basename(cfg.poster), local: hasLocal };
    const c = courseOf.get(id);
    return {
      id, slug: f.replace(/\.md$/, ""), raw, meta, pre, sections, cfg,
      title: title || meta.title || id,
      short: c?.topic || meta.title || id,
      courseName: c ? c.course.name : meta.course,
      courseIdx: c ? c.ci : 0,
      posInCourse: c ? c.si : 0,
      checks: countChecks(raw),
      video,
    };
  });

  for (const id of localVideos) {
    const cfg = (config.sessions || {})[id];
    if (!cfg?.video) console.log(`· ${id}: 원본에 영상 파일이 있어요. 유튜브(일부 공개)에 올린 뒤 fde.config.json sessions.${id}.video 에 주소를 넣으면 붙어요.`);
  }

  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(outDir)) if (f.endsWith(".html")) rmSync(join(outDir, f));
  copyFileSync(join(courseDir, "assets", "fde.css"), join(outDir, "fde.css"));
  copyFileSync(join(courseDir, "assets", "fde.js"), join(outDir, "fde.js"));

  writeFileSync(join(outDir, `${HOME_ID}.html`), renderHome(courses, notes, readFileSync(overviewFile, "utf8")));
  notes.forEach((n, i) => writeFileSync(join(outDir, `${n.slug}.html`), renderSession(n, notes, i, courses)));

  const checks = notes.reduce((a, n) => a + n.checks, 0);
  console.log(`✓ render: 코스 홈 + ${notes.length}개 세션 → public/lessons/${TOPIC}/ (확인 필요 ${checks}곳)`);
  console.log(`  확인 문제: 객관식 자동 채점 ${stats.auto}문항 · 서술형/상황형 예시 답 접기 ${stats.essay}문항`);
  if (stats.folded.length) console.log(`  객관식인데 접기로 대체: ${stats.folded.length}문항\n    - ${stats.folded.join("\n    - ")}`);
  if (stats.fallback.length) console.log(`  세션 전체 접기: ${stats.fallback.length}개\n    - ${stats.fallback.join("\n    - ")}`);
}

main();

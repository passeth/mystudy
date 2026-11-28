#!/usr/bin/env node
/**
 * Claude FDE 슬라이드 강의 묶음 가져오기.
 *
 *   npm run fde:slides                  # 봇 폴더 slides/site → public/slides/claude-fde/
 *   npm run fde:slides -- --src <dir>   # 다른 묶음 폴더(_shared/, s01/ … 가 있는 폴더)
 *   npm run fde:slides -- --check       # 복사 없이 public/ 쪽 링크만 검사
 *
 * 흐름
 *   <study>/slides/site/  ──copy──▶  public/slides/claude-fde/   (커밋되는 사본)
 *                         ──fix───▶  사이트 링크(/t/claude-fde/…)를 실제 노트 경로로 맞춤
 *                                    + 세션 페이지에 "끝 슬래시 보정" 한 줄 삽입
 *
 * 원본 폴더는 읽기만 해요. 묶음이 다 만들어지지 않았으면(세션 폴더·_shared 누락) 복사하지 않고 멈춰요.
 * 다 가져온 뒤에는 `npm run fde:render` 로 세션 페이지의 "슬라이드로 보기" 버튼을 다시 만들어요.
 */
import {
  readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync, rmSync, statSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOPIC = "claude-fde";
const lessonsDir = join(root, "public", "lessons", TOPIC);
const outDir = join(root, "public", "slides", TOPIC);
const config = JSON.parse(readFileSync(join(root, "claude-fde-course", "fde.config.json"), "utf8"));

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const srcArgIdx = args.indexOf("--src");

// 슬라이드 HTML이 끝 슬래시 없이 열리면(/slides/claude-fde/s01) 상대 경로(./assets, ../_shared)가 깨져요.
// 정적 호스팅마다 디렉터리 처리 방식이 달라서, 페이지 안에서 한 번 보정해요.
const SLASH_MARK = "<!-- mystudy:trailing-slash -->";
const SLASH_FIX = `${SLASH_MARK}<script>(function(l){if(!/\\/$|\\.html$/.test(l.pathname))l.replace(l.pathname+"/"+l.search+l.hash)})(location)</script>`;

function resolveSrc() {
  const raw = srcArgIdx >= 0 ? args[srcArgIdx + 1] : process.env.FDE_SLIDES_SRC || (config.source && join(config.source, "slides", "site"));
  if (!raw) throw new Error("슬라이드 묶음 폴더를 알 수 없어요. --src <dir> 를 주세요.");
  if (existsSync(join(raw, "site", "_shared"))) return join(raw, "site");
  if (existsSync(join(raw, "slides", "site", "_shared"))) return join(raw, "slides", "site");
  return raw;
}

/** 사이트에 실제로 있는 노트 경로: sNN → 슬러그 */
function siteLessons() {
  if (!existsSync(lessonsDir)) throw new Error(`노트 페이지가 없어요: ${relative(root, lessonsDir)} (먼저 npm run fde:render)`);
  const files = readdirSync(lessonsDir).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5));
  const bySession = new Map(files.filter((f) => /^s\d{2}-/.test(f)).map((f) => [f.slice(0, 3), f]));
  return { files: new Set(files), bySession };
}

function validateBundle(src, sessions) {
  const missing = [];
  if (!existsSync(join(src, "index.html"))) missing.push("index.html");
  if (!existsSync(join(src, "_shared"))) missing.push("_shared/");
  for (const s of sessions) {
    const dir = join(src, s);
    if (!existsSync(join(dir, "index.html"))) missing.push(`${s}/index.html`);
    else if (!existsSync(join(dir, "assets"))) missing.push(`${s}/assets/`);
  }
  if (missing.length) {
    throw new Error(`슬라이드 묶음이 아직 다 만들어지지 않았어요 (${src}).\n  없는 것: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? ` 외 ${missing.length - 12}개` : ""}\n  묶음 생성이 끝난 뒤 다시 실행하세요.`);
  }
}

function copyTree(from, to) {
  let n = 0;
  mkdirSync(to, { recursive: true });
  for (const e of readdirSync(from, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue; // .DS_Store 등
    const a = join(from, e.name);
    const b = join(to, e.name);
    if (e.isDirectory()) n += copyTree(a, b);
    else if (e.isFile()) { copyFileSync(a, b); n++; }
  }
  return n;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** /t/claude-fde/<id> 링크를 실제 노트 경로로 맞춰요. 고칠 수 없는 링크는 모아서 알려요. */
function fixLinks(lessons) {
  const re = new RegExp(`/t/${TOPIC}/([A-Za-z0-9_-]+)`, "g");
  const changed = [];
  const broken = new Set();
  let total = 0;
  for (const file of walk(outDir).filter((f) => /\.(html|js|css)$/.test(f))) {
    const text = readFileSync(file, "utf8");
    let edits = 0;
    let next = text.replace(re, (whole, id) => {
      total++;
      if (lessons.files.has(id)) return whole;
      const sid = id.match(/^(s\d{2})(?:-|$)/i)?.[1]?.toLowerCase();
      const real = sid && lessons.bySession.get(sid);
      const fixed = real || (/course-home|^0+-/.test(id) && lessons.files.has("0000-course-home") ? "0000-course-home" : "");
      if (!fixed) { broken.add(id); return whole; }
      edits++;
      changed.push(`${id} → ${fixed}`);
      return `/t/${TOPIC}/${fixed}`;
    });
    if (/[\\/]s\d{2}[\\/]index\.html$|[\\/]claude-fde[\\/]index\.html$/.test(file) && !next.includes(SLASH_MARK)) {
      next = /<meta charset[^>]*>/i.test(next)
        ? next.replace(/<meta charset[^>]*>/i, (m) => `${m}\n${SLASH_FIX}`)
        : next.replace(/<head>/i, `<head>\n${SLASH_FIX}`);
      edits++;
    }
    if (edits) writeFileSync(file, next);
  }
  return { total, changed, broken: [...broken] };
}

function sizeOf(dir) {
  return walk(dir).reduce((a, f) => a + statSync(f).size, 0);
}

function main() {
  const lessons = siteLessons();
  const sessions = [...lessons.bySession.keys()].sort();

  if (!checkOnly) {
    const src = resolveSrc();
    validateBundle(src, sessions);
    rmSync(outDir, { recursive: true, force: true });
    const n = copyTree(src, outDir);
    console.log(`✓ copy: ${src} → ${relative(root, outDir)}/ (파일 ${n}개)`);
  } else if (!existsSync(outDir)) {
    throw new Error(`${relative(root, outDir)} 가 없어요. 먼저 npm run fde:slides`);
  }

  const { total, changed, broken } = fixLinks(lessons);
  const uniq = [...new Set(changed)];
  console.log(`✓ links: 사이트 링크 ${total}곳 확인, 고친 링크 ${changed.length}곳${uniq.length ? `\n    - ${uniq.join("\n    - ")}` : " (모두 실제 경로와 같아요)"}`);
  const files = walk(outDir);
  console.log(`  크기: ${(sizeOf(outDir) / 1024 / 1024).toFixed(1)}MB · 파일 ${files.length}개 · 세션 ${sessions.filter((s) => existsSync(join(outDir, s, "index.html"))).length}/${sessions.length}`);
  if (broken.length) {
    console.error(`✗ 실제 노트가 없는 링크 ${broken.length}개: ${broken.join(", ")}`);
    process.exit(1);
  }
  if (!checkOnly) console.log("  다음: npm run fde:render  (세션 페이지의 \"슬라이드로 보기\" 버튼 갱신)");
}

try {
  main();
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}

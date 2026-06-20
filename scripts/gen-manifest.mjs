/**
 * Build-time manifest generator.
 * Source of truth:
 *   - content/topics.json       → curated topic metadata (id, title, subtitle, color, order)
 *   - public/lessons/<id>/*.html → the lesson files (title/subtitle extracted from HTML)
 * Output:
 *   - public/manifest.json
 *
 * Any lesson folder that lacks a topics.json entry is added with a default
 * color so nothing is ever dropped.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = join(root, "public", "lessons");
const topicsFile = join(root, "content", "topics.json");
const outFile = join(root, "public", "manifest.json");

const COLORS = ["lime", "lilac", "cream", "pink", "mint", "coral", "navy"];

function decode(html) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTitle(html, fallback) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? decode(m[1].trim()) : fallback;
}

function extractSubtitle(html) {
  const meta = html.match(
    /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i
  );
  if (meta) return decode(meta[1].trim());
  const div = html.match(/<[^>]*class=["'][^"']*\bsubtitle\b[^"']*["'][^>]*>([\s\S]*?)<\//i);
  if (div) return decode(div[1].replace(/<[^>]+>/g, "").trim()).slice(0, 200);
  return "";
}

let curated = [];
if (existsSync(topicsFile)) {
  curated = JSON.parse(readFileSync(topicsFile, "utf8"));
}

const folders = existsSync(lessonsDir)
  ? readdirSync(lessonsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  : [];

// merge: every folder gets a topic entry
const topicMap = new Map();
curated.forEach((t) => topicMap.set(t.id, { ...t }));
folders.forEach((id, i) => {
  if (!topicMap.has(id)) {
    topicMap.set(id, {
      id,
      title: id,
      subtitle: "",
      color: COLORS[i % COLORS.length],
      order: 999 + i,
    });
  }
});

const topics = [...topicMap.values()]
  .filter((t) => folders.includes(t.id))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  .map((t) => {
    const dir = join(lessonsDir, t.id);
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".html"))
      .sort();
    const lessons = files.map((f) => {
      const html = readFileSync(join(dir, f), "utf8");
      const id = f.replace(/\.html$/, "");
      return {
        id,
        title: extractTitle(html, id),
        subtitle: extractSubtitle(html),
        file: `lessons/${t.id}/${f}`,
      };
    });
    return { ...t, lessons };
  });

const manifest = {
  generatedAt: new Date().toISOString(),
  topics,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n");

const total = topics.reduce((n, t) => n + t.lessons.length, 0);
console.log(
  `✓ manifest: ${topics.length} topics, ${total} lessons → public/manifest.json`
);

/**
 * POST /api/upload
 * Commits an uploaded learning HTML (and, for a new topic, a topics.json entry)
 * to the GitHub repo via the Contents API. The push triggers a Vercel rebuild,
 * which regenerates public/manifest.json from the committed files.
 *
 * Required env: GITHUB_TOKEN  (repo scope)
 * Optional env: GITHUB_REPO   (default "passeth/mystudy"), GITHUB_BRANCH (default "main")
 */

const GH = "https://api.github.com";

type Body = {
  mode: "existing" | "new";
  topic: { id: string; title?: string; subtitle?: string; color?: string };
  lesson: { title: string; subtitle?: string };
  html: string;
};

const COLORS = ["lime", "lilac", "cream", "pink", "mint", "coral", "navy"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function b64(s: string): string {
  return Buffer.from(s, "utf8").toString("base64");
}

function ensureMeta(html: string, title: string, subtitle: string): string {
  let out = html;
  const titleTag = `<title>${escapeHtml(title)}</title>`;
  const descTag = subtitle
    ? `<meta name="description" content="${escapeHtml(subtitle)}">`
    : "";

  if (!/<html[\s>]/i.test(out)) {
    // fragment → wrap into a minimal document
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${titleTag}${descTag}</head><body>${out}</body></html>`;
  }
  if (/<title>[\s\S]*?<\/title>/i.test(out)) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  } else if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head[^>]*>/i, (m) => `${m}${titleTag}`);
  }
  if (descTag && !/<meta\s+name=["']description["']/i.test(out)) {
    out = out.replace(/<\/title>/i, `</title>${descTag}`);
  }
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ghFetch(
  path: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mystudy-uploader",
      ...(init?.headers || {}),
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: "서버에 GITHUB_TOKEN이 설정되지 않았습니다." });
    return;
  }
  const repo = process.env.GITHUB_REPO || "passeth/mystudy";
  const branch = process.env.GITHUB_BRANCH || "main";

  let body: Body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: "잘못된 요청 본문" });
    return;
  }

  const lessonTitle = (body?.lesson?.title || "").trim();
  const html = body?.html || "";
  if (!lessonTitle || !html.trim()) {
    res.status(400).json({ error: "레슨 제목과 HTML은 필수입니다." });
    return;
  }

  const topicId =
    body.mode === "new" ? slugify(body.topic.title || "") : body.topic.id;
  if (!topicId) {
    res.status(400).json({ error: "토픽을 지정해 주세요." });
    return;
  }

  try {
    // 1) determine next lesson index by listing the topic folder
    const dir = `public/lessons/${topicId}`;
    let nextIdx = 1;
    const listRes = await ghFetch(
      `/repos/${repo}/contents/${encodeURIComponent(dir)}?ref=${branch}`,
      token
    );
    if (listRes.ok) {
      const items: any[] = await listRes.json();
      const nums = items
        .filter((it) => it.type === "file" && it.name.endsWith(".html"))
        .map((it) => parseInt(it.name.slice(0, 4), 10))
        .filter((n) => !Number.isNaN(n));
      if (nums.length) nextIdx = Math.max(...nums) + 1;
    }
    const prefix = String(nextIdx).padStart(4, "0");
    const slug = slugify(lessonTitle.replace(/^lesson\s*\d+\s*[—-]\s*/i, "")) || "lesson";
    const fileName = `${prefix}-${slug}.html`;
    const filePath = `${dir}/${fileName}`;

    // 2) inject title/description so the build-time manifest picks them up
    const finalHtml = ensureMeta(
      html,
      lessonTitle,
      (body.lesson.subtitle || "").trim()
    );

    // 3) commit the HTML file
    const putHtml = await ghFetch(
      `/repos/${repo}/contents/${encodeURIComponent(filePath)}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `lesson: add ${topicId}/${fileName}`,
          content: b64(finalHtml),
          branch,
        }),
      }
    );
    if (!putHtml.ok) {
      const t = await putHtml.text();
      throw new Error(`HTML 커밋 실패: ${putHtml.status} ${t.slice(0, 200)}`);
    }

    // 4) for a new topic, add an entry to content/topics.json
    if (body.mode === "new") {
      const tjPath = "content/topics.json";
      const getTj = await ghFetch(
        `/repos/${repo}/contents/${tjPath}?ref=${branch}`,
        token
      );
      let topics: any[] = [];
      let sha: string | undefined;
      if (getTj.ok) {
        const j = await getTj.json();
        sha = j.sha;
        topics = JSON.parse(Buffer.from(j.content, "base64").toString("utf8"));
      }
      if (!topics.find((t) => t.id === topicId)) {
        topics.push({
          id: topicId,
          title: body.topic.title?.trim() || topicId,
          subtitle: body.topic.subtitle?.trim() || "",
          color: COLORS.includes(body.topic.color || "")
            ? body.topic.color
            : COLORS[topics.length % COLORS.length],
          order: topics.length + 1,
        });
        const putTj = await ghFetch(
          `/repos/${repo}/contents/${tjPath}`,
          token,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `topic: add ${topicId}`,
              content: b64(JSON.stringify(topics, null, 2) + "\n"),
              branch,
              ...(sha ? { sha } : {}),
            }),
          }
        );
        if (!putTj.ok) {
          const t = await putTj.text();
          throw new Error(`토픽 커밋 실패: ${putTj.status} ${t.slice(0, 200)}`);
        }
      }
    }

    res.status(200).json({
      ok: true,
      topicId,
      file: filePath,
      lessonId: fileName.replace(/\.html$/, ""),
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}

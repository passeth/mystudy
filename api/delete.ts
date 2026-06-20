/**
 * POST /api/delete   body: { topicId, lessonId }
 * Removes one lesson HTML file from the repo via the GitHub Contents API.
 * If it was the last file in the topic folder, the folder disappears and the
 * topic drops out of the next generated manifest automatically.
 *
 * Required env: GITHUB_TOKEN (repo scope)
 * Optional env: GITHUB_REPO (default "passeth/mystudy"), GITHUB_BRANCH (default "main")
 */

const GH = "https://api.github.com";

async function ghFetch(path: string, token: string, init?: RequestInit) {
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

  let body: { topicId?: string; lessonId?: string };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: "잘못된 요청 본문" });
    return;
  }

  const topicId = (body?.topicId || "").trim();
  const lessonId = (body?.lessonId || "").trim();
  if (!topicId || !lessonId) {
    res.status(400).json({ error: "topicId와 lessonId가 필요합니다." });
    return;
  }
  // guard against path traversal
  if (/[\\/]|\.\./.test(topicId) || /[\\/]|\.\./.test(lessonId)) {
    res.status(400).json({ error: "잘못된 식별자입니다." });
    return;
  }

  const path = `public/lessons/${topicId}/${lessonId}.html`;

  try {
    // need the blob sha to delete
    const getRes = await ghFetch(
      `/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      token
    );
    if (getRes.status === 404) {
      res.status(404).json({ error: "해당 레슨을 찾을 수 없습니다." });
      return;
    }
    if (!getRes.ok) {
      const t = await getRes.text();
      throw new Error(`조회 실패: ${getRes.status} ${t.slice(0, 160)}`);
    }
    const meta = await getRes.json();

    const delRes = await ghFetch(
      `/repos/${repo}/contents/${encodeURIComponent(path)}`,
      token,
      {
        method: "DELETE",
        body: JSON.stringify({
          message: `lesson: remove ${topicId}/${lessonId}.html`,
          sha: meta.sha,
          branch,
        }),
      }
    );
    if (!delRes.ok) {
      const t = await delRes.text();
      throw new Error(`삭제 실패: ${delRes.status} ${t.slice(0, 160)}`);
    }

    // if that was the topic's last lesson, drop the topic from topics.json too
    let topicRemoved = false;
    const dirRes = await ghFetch(
      `/repos/${repo}/contents/${encodeURIComponent(`public/lessons/${topicId}`)}?ref=${branch}`,
      token
    );
    const stillHasLessons =
      dirRes.ok &&
      (await dirRes.json()).some(
        (it: any) => it.type === "file" && it.name.endsWith(".html")
      );
    if (!stillHasLessons) {
      const tjPath = "content/topics.json";
      const getTj = await ghFetch(
        `/repos/${repo}/contents/${tjPath}?ref=${branch}`,
        token
      );
      if (getTj.ok) {
        const j = await getTj.json();
        const topics = JSON.parse(
          Buffer.from(j.content, "base64").toString("utf8")
        );
        const next = topics.filter((t: any) => t.id !== topicId);
        if (next.length !== topics.length) {
          await ghFetch(`/repos/${repo}/contents/${tjPath}`, token, {
            method: "PUT",
            body: JSON.stringify({
              message: `topic: remove empty ${topicId}`,
              content: Buffer.from(
                JSON.stringify(next, null, 2) + "\n",
                "utf8"
              ).toString("base64"),
              sha: j.sha,
              branch,
            }),
          });
          topicRemoved = true;
        }
      }
    }

    res.status(200).json({ ok: true, topicId, lessonId, topicRemoved });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}

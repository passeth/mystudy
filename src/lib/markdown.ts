/**
 * Dependency-free Markdown → HTML converter.
 *
 * Supported rules (the representative set):
 *   # .. ######        headings (h1–h6)
 *   **bold** __bold__  strong
 *   *italic* _italic_  em
 *   ~~strike~~         del
 *   `code`             inline code
 *   ```fenced```       code block (content kept literal)
 *   > quote            blockquote (consecutive lines merged)
 *   - / * / +          unordered list
 *   1. 2. 3.           ordered list
 *   ---  ***           horizontal rule
 *   [text](url)        link (opens in new tab)
 *   ![alt](src)        image
 *   | a | b |          table (header + --- separator + rows)
 *   blank line         paragraph break
 *
 * Output is a full, self-contained styled HTML document so it renders well
 * inside the lesson iframe. The upload function still injects <title> /
 * <meta description> into the <head> for the manifest.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// inline transforms applied to already-escaped text
function inline(text: string): string {
  let t = text;
  // images first (before links, same bracket syntax)
  t = t.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_m, alt, src) => `<img alt="${alt}" src="${src}" loading="lazy">`
  );
  // links
  t = t.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
    (_m, label, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
  // inline code (protect its content from other transforms by doing it on raw spans)
  t = t.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  // bold
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // italic (avoid matching inside words for _ )
  t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  t = t.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?=[^_\w]|$)/g, "$1<em>$2</em>");
  // strikethrough
  t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return t;
}

function isTableSep(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

export function mdToBody(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const flushList = (ordered: boolean, items: string[]) => {
    const tag = ordered ? "ol" : "ul";
    out.push(
      `<${tag}>${items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join("")}</${tag}>`
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // fenced code block
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<pre class="code"${lang ? ` data-lang="${lang}"` : ""}><code>${escapeHtml(
          buf.join("\n")
        )}</code></pre>`
      );
      continue;
    }

    // horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // heading
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(escapeHtml(h[2].trim()))}</h${level}>`);
      i++;
      continue;
    }

    // table: current line has pipes and next line is a separator
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header
        .map((c) => `<th>${inline(escapeHtml(c))}</th>`)
        .join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join("")}</tr>`
        )
        .join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(escapeHtml(buf.join(" ")))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      flushList(false, items);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      flushList(true, items);
      continue;
    }

    // paragraph: gather consecutive non-blank, non-special lines
    const buf: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^\s*```/.test(lines[i]) &&
      !/^\s*(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    if (buf.length) {
      // single newline inside a paragraph → <br>
      out.push(`<p>${inline(escapeHtml(buf.join("\n"))).replace(/\n/g, "<br>")}</p>`);
    }
  }

  return out.join("\n");
}

const DOC_STYLE = `
  :root { --ink:#1a1a1a; --muted:#6b6b6b; --line:#e6e6e6; --accent:#ff3d8b; --code-bg:#f5f5f3; }
  * { box-sizing: border-box; }
  body {
    font-family: "Inter","SF Pro Display","Apple SD Gothic Neo",system-ui,sans-serif;
    color: var(--ink); max-width: 760px; margin: 48px auto; padding: 0 24px 96px;
    line-height: 1.7; font-size: 17px; font-weight: 360;
    -webkit-font-smoothing: antialiased;
  }
  h1,h2,h3,h4,h5,h6 { line-height: 1.25; letter-spacing: -0.02em; font-weight: 600; margin: 1.8em 0 0.6em; }
  h1 { font-size: 2em; margin-top: 0; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; } h4 { font-size: 1.08em; }
  p { margin: 0 0 1.1em; }
  a { color: #0b66c3; text-decoration: underline; text-underline-offset: 2px; }
  strong { font-weight: 650; }
  ul,ol { margin: 0 0 1.1em; padding-left: 1.4em; }
  li { margin: 0.3em 0; }
  blockquote { margin: 1.2em 0; padding: 0.4em 1.1em; border-left: 3px solid var(--accent); color: #333; background: #fafafa; border-radius: 0 6px 6px 0; }
  code { font-family: "JetBrains Mono","SF Mono",Menlo,monospace; font-size: 0.88em; background: var(--code-bg); padding: 2px 6px; border-radius: 4px; }
  pre.code { background: var(--code-bg); padding: 16px 18px; border-radius: 8px; overflow-x: auto; margin: 1.2em 0; }
  pre.code code { background: none; padding: 0; font-size: 13px; line-height: 1.55; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }
  img { max-width: 100%; border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; margin: 1.4em 0; font-size: 15px; display: block; overflow-x: auto; }
  th,td { border: 1px solid var(--line); padding: 8px 12px; text-align: left; vertical-align: top; }
  th { background: #f7f7f5; font-weight: 600; }
  del { color: var(--muted); }
`;

/** Convert Markdown into a full styled HTML document. */
export function mdToHtml(md: string, title = "Untitled"): string {
  const body = mdToBody(md);
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${DOC_STYLE}</style>
</head>
<body>
${body}
</body>
</html>`;
}

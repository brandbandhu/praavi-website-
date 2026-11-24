import type { ReactNode } from "react";

const MAX_URL_LENGTH = 4096;
const MAX_URL_PAREN_DEPTH = 8;

const escapedAt = (text: string, index: number) => {
  let backslashes = 0;
  while (index > 0 && text[--index] === "\\") backslashes++;
  return backslashes % 2 === 1;
};

const safeHref = (value: string): string | null => {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (!/^https?:\/\/[^/]/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
    return value;
  } catch { return null; }
};

// Deliberately limited to inline links: never execute HTML or reinterpret the
// existing paragraph/numbered-heading structure. React escapes all text/attrs.
const BlogInlineLinks = ({ text }: { text: string }) => {
  const candidates = /`+|\[([^\[\]\r\n]+)\]\(/g;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let codeTicks = 0;
  let match: RegExpExecArray | null;
  while ((match = candidates.exec(text))) {
    if (escapedAt(text, match.index)) continue;
    if (match[0].startsWith("`")) {
      if (!codeTicks) codeTicks = match[0].length;
      else if (codeTicks === match[0].length) codeTicks = 0;
      continue;
    }
    if (codeTicks) continue;
    const imageCandidate = text[match.index - 1] === "!";
    const start = candidates.lastIndex;
    let end = start;
    let depth = 1;
    for (; end < text.length && end - start <= MAX_URL_LENGTH; end++) {
      const char = text[end];
      if (/\s/.test(char) || char === "\\") break;
      if (char === "(" && ++depth > MAX_URL_PAREN_DEPTH) break;
      if (char === ")" && --depth === 0) break;
    }
    if (depth !== 0) continue;
    candidates.lastIndex = end + 1;
    if (imageCandidate) continue;
    const href = safeHref(text.slice(start, end));
    if (!href || !match[1].trim()) continue;
    parts.push(text.slice(cursor, match.index));
    parts.push(<a key={match.index} href={href} className="text-primary hover:underline">{match[1]}</a>);
    cursor = end + 1;
  }
  if (!parts.length) return text;
  parts.push(text.slice(cursor));
  return <>{parts}</>;
};

export default BlogInlineLinks;

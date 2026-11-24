type BlogBlock =
  | { type: "paragraph" | "heading" | "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] };

const bullet = /^(?:[-*+•●▪✓✔✅❌]\uFE0F?)\s+(.+)$/u;
const numberedHeading = /^\d+\.\s+\S/u;
const numbered = /^\d+\)\s+(.+)$/u;
const decimalItem = (line: string) => line.match(/^\d+\.\s+(.+)$/u)?.[1];
const markdownHeading = /^(#{1,6})\s+(.+)$/u;
const sectionLabel = /^[^\p{L}\p{N}]*(?:(?:.*:\s*)?(?:what|why|how|when|which|should|can|does|is|are|do|will)\b.*\?|(?:final thoughts|conclusion|summary|faqs?|frequently asked questions|key takeaways)|(?:advantages|benefits|limitations|disadvantages|key elements|common mistakes|best practices|comparison)\b.*|.*\bkey differences)\s*:?$/iu;
const listIntro = /(?:[:：]|\b(?:includes?|involves?|consists of|such as|for example))$/iu;
const numberedItem = (line: string) => line.match(numbered)?.[1];
const bulletItem = (line: string) => line.match(bullet)?.[1];

const isSectionLabel = (line: string) =>
  line.length <= 120 && !/^[-*+•●▪]\s/u.test(line) && sectionLabel.test(line) && !/[.!]$/u.test(line);

const isPlainListItem = (line: string) =>
  line.length > 0 && line.length <= 110 && line.split(/\s+/u).length <= 16 &&
  !/[.!?…:।]$/u.test(line) && !line.includes("\t") &&
  !bulletItem(line) && !numberedItem(line) && !numberedHeading.test(line) && !markdownHeading.test(line) &&
  !isSectionLabel(line) && !listIntro.test(line);

const plainListItem = (line: string) => isPlainListItem(line) ? line : undefined;

const readTable = (lines: string[], index: number) => {
  const columns = lines[index].split(/\t+/u).map((cell) => cell.trim());
  if (columns.length >= 2 && columns.every(Boolean)) {
    const rows: string[][] = [];
    let next = index + 1;
    for (; next < lines.length; next++) {
      const cells = lines[next].split(/\t+/u).map((cell) => cell.trim());
      if (cells.length !== columns.length || !cells.every(Boolean)) break;
      rows.push(cells);
    }
    if (rows.length) return { columns, rows, next };
  }

  // Some pasted comparisons put every cell on its own line.
  const flatColumns = lines.slice(index, index + 3);
  if (!/^(?:factor|feature)$/iu.test(flatColumns[0]) ||
      !/^seo$/iu.test(flatColumns[1] ?? "") ||
      !/^(?:google ads|paid ads)$/iu.test(flatColumns[2] ?? "")) return;

  let next = index + flatColumns.length;
  const rows: string[][] = [];
  while (next + 2 < lines.length) {
    const row = lines.slice(next, next + 3);
    if (!row.every(isPlainListItem)) break;
    rows.push(row);
    next += row.length;
  }
  if (rows.length) return { columns: flatColumns, rows, next };
};

export const parseBlogContent = (content: string): BlogBlock[] => {
  const lines = content.split(/\r\n?|\n/u).map((line) => line.trim()).filter(Boolean);
  const blocks: BlogBlock[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const nextLine = lines[index + 1] ?? "";
    const heading = line.match(markdownHeading);
    const table = readTable(lines, index);
    const followsListIntro = listIntro.test(lines[index - 1] ?? "");
    const hasNumberedPoints = followsListIntro && decimalItem(line) && decimalItem(nextLine);

    if (table) {
      blocks.push({ type: "table", columns: table.columns, rows: table.rows });
      index = table.next;
      continue;
    }

    if (heading || (numberedHeading.test(line) && !hasNumberedPoints) || isSectionLabel(line)) {
      blocks.push({
        type: heading && heading[1].length > 2 ? "subheading" : "heading",
        text: heading?.[2] ?? line,
      });
      index++;
      continue;
    }

    const plainList = isPlainListItem(line) &&
      (isPlainListItem(nextLine) || followsListIntro);
    let getItem: ((value: string) => string | undefined) | undefined;
    if (bulletItem(line)) getItem = bulletItem;
    else if (numberedItem(line)) getItem = numberedItem;
    else if (hasNumberedPoints) getItem = decimalItem;
    else if (plainList) getItem = plainListItem;
    if (getItem) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = getItem(lines[index]);
        if (!item) break;
        items.push(item);
        index++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
    index++;
  }

  return blocks;
};

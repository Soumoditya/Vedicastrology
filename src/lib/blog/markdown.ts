import { marked } from 'marked';

/**
 * Post rendering.
 *
 * Markdown rather than a rich text editor. The stored form stays readable and
 * portable, a post can be pasted in from anywhere, and there is no editor
 * state to corrupt. The admin editor pairs it with a formatting toolbar and a
 * live preview, so nobody has to memorise the syntax.
 *
 * Only the site administrator can create posts, and that is enforced by row
 * level security, so the markdown source is trusted input. If authorship is
 * ever opened to other people, this must gain a sanitiser before it ships.
 */

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}

/**
 * Reading time in minutes.
 *
 * 200 words a minute is the usual estimate for considered prose. Rounded up,
 * and never zero, because "0 min read" looks broken.
 */
export function readingMinutes(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Table of contents from the h2 and h3 headings.
 *
 * Built from the markdown source rather than by parsing the rendered HTML,
 * which keeps the slugs identical to the ids `renderHeadings` writes.
 */
export function tableOfContents(source: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();

  for (const line of source.split('\n')) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[*_`]/g, '');
    const base = slugify(text);

    // Two headings with the same words must not share an id, or the anchor
    // links jump to the wrong one.
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    entries.push({ id: count === 0 ? base : `${base}-${count}`, text, level });
  }

  return entries;
}

/**
 * Add matching ids to the rendered headings so the contents list can link to
 * them. Applied after `renderMarkdown`, using the same slug rules.
 */
export function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(
    /<(h[23])>(.*?)<\/\1>/g,
    (_match, tag: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, '');
      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;
      return `<${tag} id="${id}">${inner}</${tag}>`;
    },
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** First paragraph of a post, for the listing when no excerpt is written. */
export function autoExcerpt(source: string, limit = 180): string {
  const firstParagraph = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    // Skip headings, images and quotes when looking for prose.
    .find((block) => block && !/^[#>!\-*]/.test(block));

  if (!firstParagraph) return '';

  const plain = firstParagraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.length > limit ? `${plain.slice(0, limit).trimEnd()}…` : plain;
}

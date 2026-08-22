import type { ReportTheme } from './themes';

/**
 * The stylesheet Paged.js is handed.
 *
 * Kept as a string rather than living in `globals.css` for a reason that is not
 * stylistic: the `Previewer` API only parses sheets passed to it. It does not go
 * looking through `document.styleSheets` the way the auto-running polyfill does,
 * so a `@page` rule sitting in a `<style>` tag is invisible to it. This is also
 * why the whole thing is themeable in one call — the four grounds differ only in
 * the values at the top.
 *
 * Everything the browser could not do is in here:
 *
 *   · **Page numbers.** `@bottom-center { content: counter(page) }`. Chrome has
 *     never implemented margin boxes, which is why the report had no numbering
 *     at all and could not have had any without this library.
 *   · **Running headers.** `string-set` on a section heading, read back with
 *     `string(section)`. A section that runs to four pages names itself on all
 *     four, which is what the reference document does and what makes a long
 *     report navigable.
 *   · **A bounded page.** Every sheet is now the same height because Paged.js
 *     fragments into real page boxes. Nothing here needs to fake it with a fixed
 *     height, which is what the old stylesheet tried and why content overflowed.
 *
 * The break rules are deliberately sparse. `break-before: page` on the things
 * that were asked to start a page, `break-inside: avoid` on the things that must
 * not be torn — a chart, a table row, a finding — and nothing else. Every extra
 * break is a half-empty page, and half-empty pages were half the complaint.
 */
export function pagedCss(theme: ReportTheme, personName: string): string {
  const t = theme;

  return `
:root {
  --rp-paper: ${t.paper};
  --rp-ink: ${t.ink};
  --rp-muted: ${t.muted};
  --rp-rule: ${t.rule};
  --rp-accent: ${t.accent};
  --rp-panel: ${t.panel};
  --rp-cover-paper: ${t.coverPaper};
  --rp-cover-ink: ${t.coverInk};
}

/* ===================================================================== page */

@page {
  size: A4;
  margin: 16mm 15mm 18mm;

  @top-left {
    content: "${escapeCss(personName)}";
    font-family: var(--font-body), Georgia, serif;
    font-size: 7.5pt;
    letter-spacing: 0.06em;
    color: ${t.muted};
    padding-bottom: 2mm;
  }

  @top-right {
    /*
      Set per page after pagination rather than by string-set.

      The spec way is a named string: string-set on the heading, string(section)
      here. Paged.js compiles that to a custom property it fills in itself, and
      on this document it filled every page with undefined — the handler never
      captured the heading text. Rather than keep guessing at an under-documented
      feature, Paginate walks the finished pages and writes this variable, which
      is the same semantics (the section starting on this page, else the one
      carried onto it) and can actually be inspected when it goes wrong.
    */
    content: var(--rp-running, "");
    font-family: var(--font-body), Georgia, serif;
    font-size: 7.5pt;
    letter-spacing: 0.06em;
    color: ${t.muted};
    padding-bottom: 2mm;
  }

  @bottom-left {
    content: "vedicastrologey.com";
    font-size: 7pt;
    color: ${t.muted};
    padding-top: 2mm;
  }

  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 7.5pt;
    color: ${t.muted};
    padding-top: 2mm;
  }
}

/*
  Covers and part dividers carry no furniture, done with a class rather than a
  named page.

  The obvious way is '@page plate { margin: 0; @top-left { content: none } ... }'
  and a 'page: plate' on the element. That is the spec, and it is also the one
  construct that stopped this document paginating at all: with a named page rule
  in the sheet, Paged.js emitted no pages and no error, whatever the document
  contained. Every other exotic feature had already been stripped by then —
  named strings, target counters, animations — and this was what remained.

  Paginate marks each plate page with a data attribute once pagination is done,
  and the margin boxes are hidden from it. Same result, one fewer feature to be
  at the mercy of.
*/
.pagedjs_page[data-plate] .pagedjs_margin { display: none !important; }

/* ===================================================================== base */

* { box-sizing: border-box; }

html, body {
  background: ${t.paper};
  color: ${t.ink};
  font-family: var(--font-body), Georgia, serif;
  font-size: 10pt;
  line-height: 1.55;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pagedjs_page { background: ${t.paper}; }

/* Nothing on screen belongs in the document. */
.no-print { display: none !important; }

/*
  Nothing moves in a printed document.

  This is not tidiness. The report embeds the site's ornaments, and those carry
  'animation: ... infinite' — a rashi chakra that turns, a navagraha that orbits.
  A paginator measures the same nodes thousands of times while it decides where
  the paper ends, and a running animation invalidates style under every one of
  those measurements. The symptom is not a wrong layout, it is a paginator that
  never finishes: no error, no pages, the source untouched, the tab pinned.

  Killing motion for the paged document is also just correct. Paper does not
  animate, and the ornaments were drawn to read as engravings when still.
*/
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
}

/* ================================================================= sections */

/*
  One rule does the pagination the report asked for: a section starts a page.
  It also publishes its own name for the running header, so a section that spans
  four sheets is labelled on all four.
*/
.rp-section { break-before: page; }

.rp-section-title {
  font-family: var(--font-display), Georgia, serif;
  font-size: 16pt;
  font-weight: 400;
  color: ${t.accent};
  margin: 0 0 1mm;
  break-after: avoid;
}
.rp-section-sanskrit {
  font-size: 8.5pt;
  font-style: italic;
  letter-spacing: 0.1em;
  color: ${t.muted};
  margin: 0 0 6mm;
  padding-bottom: 3mm;
  border-bottom: 0.6pt solid ${t.rule};
  break-after: avoid;
}

.rp-block { margin: 0 0 7mm; }
.rp-block > h3 {
  font-family: var(--font-display), Georgia, serif;
  font-size: 11.5pt;
  font-weight: 400;
  color: ${t.accent};
  margin: 0 0 2.5mm;
  break-after: avoid;
}

.rp-prose { margin: 0 0 3mm; max-width: 38em; orphans: 3; widows: 3; }
.rp-meta { font-size: 8.5pt; color: ${t.muted}; margin: 0 0 2.5mm; }
.rp-lede { font-size: 11pt; line-height: 1.6; margin: 0 0 4mm; max-width: 36em; }

.rp-note {
  font-size: 8.5pt;
  line-height: 1.5;
  color: ${t.muted};
  background: ${t.panel};
  border-left: 1.5pt solid ${t.rule};
  padding: 3mm 4mm;
  margin: 4mm 0 0;
  break-inside: avoid;
}

.rp-list { margin: 0 0 3mm; padding-left: 5mm; }
.rp-list li { margin: 0 0 1.5mm; break-inside: avoid; }

/* =================================================================== tables */

.rp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 0 0 4mm;
}
.rp-table th {
  text-align: left;
  font-weight: 600;
  font-size: 7.5pt;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${t.muted};
  border-bottom: 0.8pt solid ${t.rule};
  padding: 1.6mm 2mm;
}
.rp-table td {
  padding: 1.4mm 2mm;
  border-bottom: 0.4pt solid ${t.rule}66;
  vertical-align: top;
}
.rp-table tr { break-inside: avoid; }
/* A table head repeats when its table runs over a page, which is the whole
   reason a long table is readable at all. */
.rp-table thead { display: table-header-group; }
.rp-table .is-now td { background: ${t.panel}; font-weight: 600; }
.rp-num { text-align: right; font-variant-numeric: tabular-nums; }

/* ==================================================================== pairs */

.rp-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 8mm;
  margin: 0 0 4mm;
}
.rp-cell {
  display: flex;
  justify-content: space-between;
  gap: 3mm;
  padding: 1.3mm 0;
  border-bottom: 0.4pt solid ${t.rule}55;
  break-inside: avoid;
}
.rp-cell dt { color: ${t.muted}; font-size: 8.5pt; }
.rp-cell dd { margin: 0; text-align: right; font-weight: 600; font-size: 8.5pt; }

/* =================================================================== charts */

.rp-chart {
  break-inside: avoid;
  text-align: center;
  margin: 0 0 5mm;
}
.rp-chart img { width: 118mm; height: auto; display: block; margin: 0 auto; }
.rp-chart-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6mm;
  break-inside: avoid;
}
.rp-chart-pair img { width: 100%; }
.rp-chart-caption {
  font-size: 8pt;
  color: ${t.muted};
  margin: 2mm 0 0;
  text-align: center;
}

/* ================================================================ furniture */

.rp-verdict {
  font-family: var(--font-display), Georgia, serif;
  font-size: 14pt;
  color: ${t.accent};
  margin: 0 0 2mm;
}

.rp-finding, .rp-advice { break-inside: avoid; margin: 0 0 4mm; }
.rp-finding-name { font-weight: 600; margin: 0 0 1mm; }
.rp-finding-name span { font-weight: 400; color: ${t.muted}; font-size: 8.5pt; }

.rp-graha-head {
  display: flex;
  align-items: center;
  gap: 3mm;
  margin: 0 0 2mm;
  break-after: avoid;
}
.rp-graha-head svg { width: 8mm; height: 8mm; }

/* ============================================================ cover / plate */

.rp-plate {
  break-before: page;
  break-after: page;
  /*
    A fixed height that fits inside the page's content box, and never split.

    Three shapes hang the paginator and it is worth naming all of them. A height
    of 297mm — the full sheet — cannot fit a content box of 297 less 34mm of
    margin, so the box is pushed to a fresh page forever: that is the two
    thousand page report. A min-height is worse, because every fragment
    re-asserts the minimum and the box splits without end. And no height at all
    leaves a flex column that the paginator will try to break in the middle of.

    246mm fits, break-inside keeps it whole, and the plate reads as a full page
    because its ground is the page's ground.
  */
  height: 246mm;
  break-inside: avoid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: ${t.coverPaper};
  color: ${t.coverInk};
  padding: 24mm 20mm;
}
.rp-plate-brand {
  font-size: 8pt;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: ${t.accent};
  margin: 0 0 6mm;
}
.rp-plate-title {
  font-family: var(--font-display), Georgia, serif;
  font-size: 30pt;
  font-weight: 400;
  line-height: 1.1;
  margin: 0 0 3mm;
}
.rp-plate-sub {
  font-size: 10pt;
  font-style: italic;
  color: ${t.accent};
  margin: 0 0 10mm;
}
.rp-plate-ornament { margin: 0 0 10mm; }
.rp-plate-ornament svg { width: 52mm; height: 52mm; }

.rp-plate-card {
  border: 0.8pt solid ${t.rule};
  padding: 6mm 8mm;
  min-width: 92mm;
  text-align: left;
}
.rp-plate-row {
  display: flex;
  justify-content: space-between;
  gap: 8mm;
  padding: 1.6mm 0;
  font-size: 9pt;
  border-bottom: 0.4pt solid ${t.rule}55;
}
.rp-plate-row:last-child { border-bottom: none; }
.rp-plate-row span { color: ${t.muted}; }
.rp-plate-row strong { font-weight: 600; }
.rp-plate-foot { font-size: 8pt; color: ${t.muted}; margin: 8mm 0 0; }

/* ================================================================= contents */

/*
  No 'string-set' here, and none anywhere else in this sheet.

  Paged.js's named-string handler is registered at setup and runs for every page
  it lays out. On this document it never produced a value — every page came back
  'undefined' — and leaving the declaration in place stalled the flow before a
  single page was emitted, whatever the document contained. Running headers are
  written from Paginate after pagination instead; this rule has nothing left to
  contribute but the hang.
*/
.rp-toc { break-before: page; }
.rp-toc ol { list-style: none; margin: 0; padding: 0; }
.rp-toc li {
  display: flex;
  align-items: baseline;
  gap: 2mm;
  padding: 1.5mm 0;
  border-bottom: 0.4pt dotted ${t.rule}77;
  break-inside: avoid;
}
.rp-toc a { color: ${t.ink}; text-decoration: none; flex: 1; }
/*
  The page each section landed on, written in after pagination.

  The spec way is 'target-counter(attr(href url), page)', which reads the page
  counter at the far end of the link. It is also the single most expensive thing
  you can ask a paginator for: every resolved reference can change the length of
  the contents page, which changes the page numbers, which requires another
  pass. On a document this size that either takes forever or does not converge.
  'attr(href url)' is thinly supported on top of that.

  Paginate fills these from the finished pages instead — one pass, exact, and
  inspectable. The width is reserved so writing a number in cannot reflow the
  line it sits on.
*/
.rp-toc-page {
  min-width: 3em;
  text-align: right;
  color: ${t.muted};
  font-variant-numeric: tabular-nums;
}

/* ================================================================== shloka */

.rp-shloka { font-size: 11pt; line-height: 1.9; white-space: pre-line; margin: 0 0 4mm; }
.rp-shloka-tr { font-size: 9pt; font-style: italic; color: ${t.muted}; white-space: pre-line; margin: 0 0 3mm; }
.rp-shloka-src { font-size: 8pt; letter-spacing: 0.1em; color: ${t.accent}; }
`;
}

/** Quotes are the one thing that can break out of a CSS content string. */
function escapeCss(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * The same stylesheet, for reading on screen.
 *
 * `/report` and `/report/print` render one document, so they must not carry two
 * stylesheets that drift. This derives the screen one from the paged one rather
 * than restating it: the page rules go (a browser ignores them anyway, which is
 * the whole reason Paged.js exists), and the page ground is scoped to a wrapper
 * so an ivory report does not repaint the site's dark chrome around it.
 */
export function screenCss(theme: ReportTheme): string {
  return pagedCss(theme, '')
    // `@page` and its margin boxes, including one level of nesting.
    .replace(/@page[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
    .replace('html, body {', '.rp-screen {');
}

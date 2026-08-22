import { REPORT_FONT_FACE } from './fontFace';
import type { ReportTheme } from './themes';

/**
 * The report stylesheet.
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
function baseCss(theme: ReportTheme): string {
  const t = theme;

  /*
    A ground behind the body text, where the theme has one.

    Fixed to the viewport rather than tiled down the document, so a section that
    runs to four pages does not carry four copies of the same figure sliding past
    at different offsets. At six per cent it reads as texture — the page looks
    printed on something — and every line of type still sits at full contrast
    against it, which was the condition for putting a picture behind text at all.
  */
  /*
    A quiet ground behind the body text.

    It hangs off '.rp-section' and '.rp-plate' rather than off the document,
    because those are the boxes that map to sheets. The old version put it on a
    'position: fixed' pseudo-element, which is viewport-sized rather than
    page-sized: on screen it was one wash that did not scroll, and in print
    Chrome painted it on page one only. A background on a fragmented box repeats
    per fragment, which is what a paper ground should do.
  */
  const pageGround = t.art
    ? `
.rp-section, .rp-toc {
  background-image: url("${t.art.page}");
  background-size: 150mm auto;
  background-position: 50% 42%;
  background-repeat: no-repeat;
}
`
    : '';


  /*
    A plate is one whole page, so its height has to come from the page box it
    will sit in rather than from a number typed once and shared by four grounds.

    That sharing is not a tidiness point. A box taller than the content box can
    never fit, so the fragmenter pushes it to a fresh page, where it still does
    not fit, forever: 246mm was safe under night's 16/18mm margins and three
    millimetres too tall under parchment's 20/22mm plus its 6mm frame inset.
    The same arithmetic produced a two-thousand-page report once already.
  */
  const pm = t.style.pageMargin.trim().split(/s+/).map((v) => Number.parseFloat(v));
  const marginTop = pm[0];
  const marginBottom = pm.length >= 3 ? pm[2] : pm[0];
  const frameInset = t.style.plateStyle === 'framed' ? 12 : 0;
  /* Two millimetres of slack, so sub-pixel rounding cannot tip it over. */
  const plateHeight = 297 - marginTop - marginBottom - frameInset - 2;

  /*
    Night keeps the hairline it always had. Ivory doubles it in kumkum, the way
    a patrika rules a heading. Parchment drops the rule entirely and opens with a
    drop cap instead, which is how a manuscript starts a chapter. Classical
    numbers its sections, because a reference book is navigated rather than read.
  */
  const headRule =
    t.style.headRule === 'double'
      ? `.rp-section-sanskrit { border-bottom: 2.4pt double ${t.accent}; }`
      : t.style.headRule === 'none'
        ? `.rp-section-sanskrit { border-bottom: none; padding-bottom: 0; margin-bottom: 4mm; }`
        : t.style.headRule === 'numbered'
          ? `.rp-section { counter-increment: rp-part; }
.rp-section-title::before {
  content: counter(rp-part) ".  ";
  color: ${t.muted};
  font-variant-numeric: tabular-nums;
}
.rp-section-sanskrit { border-bottom: 0.6pt solid ${t.rule}; }`
          : `.rp-section-sanskrit { border-bottom: 0.6pt solid ${t.rule}; }`;

  const dropCap = t.style.dropCap
    ? `.rp-section > .rp-lede:first-of-type::first-letter,
.rp-section > .rp-block:first-of-type > .rp-prose:first-of-type::first-letter {
  float: left;
  font-family: ${t.style.displayFont};
  font-size: 3.1em;
  line-height: 0.82;
  padding: 1mm 2mm 0 0;
  color: ${t.accent};
}`
    : '';

  /*
    Ruled is the almanac default. Open removes the body rules and leans on space,
    which suits a manuscript. Zebra bands alternate rows, which is what makes a
    dense reference table scannable and is the only one of the three that earns
    its ink on a page of forty numbers.
  */
  const tableSkin =
    t.style.tableStyle === 'open'
      ? `.rp-table td { border-bottom: none; padding: 1.9mm 2mm; }
.rp-table th { border-bottom: 0.5pt solid ${t.rule}; }`
      : t.style.tableStyle === 'zebra'
        ? `.rp-table td { border-bottom: none; }
.rp-table tbody tr:nth-child(even) td { background: ${t.panel}; }`
        : '';

  /*
    Night is the only ground with photographs. The other three compose their
    plates: ivory sets a double border inside the trim, parchment a single
    hairline frame with generous inset, classical nothing at all.
  */
  const plateSkin =
    t.style.plateStyle === 'bordered'
      ? `.rp-plate { border: 2.4pt double ${t.rule}; outline: 0.6pt solid ${t.rule}; outline-offset: 3mm; }`
      : t.style.plateStyle === 'framed'
        ? `.rp-plate { border: 0.8pt solid ${t.rule}; margin: 6mm; padding: 30mm 24mm; }`
        : '';

  return `
${REPORT_FONT_FACE}

:root {
  color-scheme: ${t.style.colorScheme};
  counter-reset: rp-part;
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
  margin: ${t.style.pageMargin};
}

/*
  No margin boxes here, deliberately.

  Page numbers, running headers and the site line used to be declared as
  '@top-left', '@bottom-center' and friends. Chrome has never implemented CSS
  margin boxes, so in a browser they printed nothing; Paged.js implements them
  but stalled on this document, and chasing that cost a round. The PDF is now
  produced by headless Chrome through /api/report/pdf, whose own
  'headerTemplate' and 'footerTemplate' number the pages natively and are the
  only mechanism here that has ever actually worked.
*/

/* ===================================================================== base */

* { box-sizing: border-box; }

.rp-root {
  background: ${t.paper};
  color: ${t.ink};
  font-family: ${t.style.bodyFont};
  font-size: ${t.style.bodySize};
  line-height: ${t.style.bodyLeading};
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/*
  Nothing on screen belongs in the document.

  Scoped to print, and that scoping is the whole point. Unscoped, this rule is
  emitted into a global <style> on two screen routes, where it hid the report's
  own theme switcher on all four grounds and deleted the journey rail from
  /report. A stylesheet meant for paper must never assert anything about the
  screen.
*/
@media print {
  .no-print { display: none !important; }
}
${pageGround}

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
/*
  A section starts a page only when it was asked to.

  Every section used to force one, and that is where the empty half-pages came
  from: a chart and its one-line note would take a third of a sheet and abandon
  the rest. The ones that were specifically asked for their own page say so with
  data-page; everything else flows and is merely kept from being torn.
*/
.rp-section { break-inside: auto; padding-top: 4mm; }
.rp-section[data-page='true'] { break-before: page; }
.rp-section + .rp-section:not([data-page='true']) {
  margin-top: 8mm;
  padding-top: 6mm;
  border-top: 0.4pt solid ${t.rule}66;
}

.rp-section-title, .rp-section-sanskrit {
  text-align: ${t.style.headAlign === 'center' ? 'center' : 'left'};
}

.rp-section-title {
  font-family: ${t.style.displayFont};
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
  break-after: avoid;
}

/*
  How a section announces itself, which is one of the things that makes a ground
  a different book rather than a different colour.
*/
${headRule}
${dropCap}
${tableSkin}
${plateSkin}

.rp-block { margin: 0 0 7mm; }
.rp-block > h3 {
  font-family: ${t.style.displayFont};
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
/*
  A chart page is a chart, so the chart may as well be worth looking at.

  118mm was a thumbnail on a 176mm text block: it filled about a third of the
  sheet and left the rest blank, which is most of what "never waste page space"
  was about. Filling the measure also makes the degrees legible, which was the
  point of printing them.
*/
.rp-chart img { width: 100%; max-width: 168mm; height: auto; display: block; margin: 0 auto; }
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
  font-family: ${t.style.displayFont};
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
  /*
    The containing block for '.rp-plate-art', which is 'position: absolute;
    inset: 0'. Without this the art had no positioned ancestor on the screen
    route and resolved against the initial containing block instead, so all six
    plate images rendered at viewport size stacked on top of each other at the
    top of the document. That is what "you removed the background images" looked
    like: they were all there, piled up off-plate.
  */
  position: relative;
  break-before: page;
  break-after: page;
  /* Sized to this ground's page box; see the note where it is computed. */
  height: ${plateHeight}mm;
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
/*
  The photographic plate, anchored to the top.

  These images are 900x1600 and the page is nearer 0.69, so 'cover' has to throw
  away about eighteen per cent of the height however it is anchored. Centred, it
  took that out of both ends and cut the subject in half — which is what was
  reported. All four of these compositions sit in their upper portion, so
  anchoring to the top trims empty sky instead.
*/
.rp-plate-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 12%;
  z-index: 0;
}
.rp-plate[data-art] > *:not(.rp-plate-art) { position: relative; z-index: 1; }
/* Enough ground behind the type to read against the picture. */
.rp-plate[data-art] .rp-plate-card {
  background: rgba(6, 10, 24, 0.72);
  backdrop-filter: none;
}

.rp-plate-brand {
  font-size: 8pt;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: ${t.accent};
  margin: 0 0 6mm;
}
.rp-plate-title {
  font-family: ${t.style.displayFont};
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
  No 'string-set' and no 'target-counter' here.

  Both are the spec answers and neither is reachable. Chrome implements no named
  strings and no target counters, so a contents page cannot read the page its
  entry landed on from CSS alone. The PDF route measures it instead: after layout
  in print emulation it reads each section's offset, divides by the page content
  height, and writes the number in before printing. One pass, exact, and
  inspectable when it goes wrong.
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
  The page each section landed on, filled in by the PDF route before printing.
  The width is reserved so writing a number in cannot reflow the line it sits on.
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

/**
 * The document as it is read on screen.
 *
 * Scoped to a wrapper so an ivory report does not repaint the site dark chrome
 * around it, and with the page rules dropped, which a browser ignores in a
 * scrolling view anyway. Sections stop starting new pages here, because on
 * screen there are no pages. That is what the PDF is for.
 */
export function screenCss(theme: ReportTheme): string {
  return (
    baseCss(theme)
      .replace(/@page[^{]*{(?:[^{}]|{[^{}]*})*}/g, '')
      .replace(".rp-root {", ".rp-screen {") +
    `
.rp-screen .rp-section { break-before: auto; padding-top: 10mm; }
.rp-screen .rp-section:first-child { padding-top: 0; }
.rp-screen .rp-plate { height: auto; min-height: 0; padding: 18mm 16mm; }
`
  );
}

/**
 * The document as it is printed.
 *
 * This is what headless Chrome loads at /report/print. Nothing here simulates a
 * sheet: Chrome fragments the flow against the real page box and its own PDF
 * pipeline draws the page numbers, so the HTML only has to say where a break
 * belongs and what must never be torn.
 */
export function printCss(theme: ReportTheme): string {
  return (
    baseCss(theme) +
    `
/*
  The sheet background has to reach the page box, not just the content box.

  !important because the site's own globals.css also styles html and body, the
  print route sits under the same root layout, and the site is dark by default.
  Without it an ivory report printed as an ivory panel floating in the site's
  near-black surface, with the page margins the wrong colour on every sheet.
*/
html, body { background: ${theme.paper} !important; margin: 0; padding: 0; }
.rp-doc { margin: 0; padding: 0; }
@media screen {
  /* Only ever seen when a person opens the print route directly to debug it. */
  .rp-doc { max-width: 210mm; margin: 0 auto; padding: 12mm 15mm; }
}
`
  );
}

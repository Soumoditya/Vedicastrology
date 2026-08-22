'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Real pages, in the browser.
 *
 * The report is printed with `window.print()`, and browsers do not implement the
 * half of CSS Paged Media that matters for a document like this. Chrome has
 * never supported `@page` margin boxes, so `@bottom-center { content: counter(page) }`
 * — a page number — is simply unreachable from a stylesheet. Nor does the print
 * path give any way to bound a page: `break-after: page` says where a *new* page
 * starts, never how tall the old one was allowed to get, which is why a section
 * with thirty-eight cells in it silently became three physical pages with one
 * heading between them.
 *
 * Paged.js implements the spec. It takes the flowed document, fragments it into
 * real fixed-size page boxes, and fills the margin boxes — so numbering, running
 * headers, consistent page height, break control and a table of contents that
 * knows what page things landed on all start working at once. They were never
 * separate problems; they were one missing layer wearing several hats.
 *
 * The cost, stated plainly: paginating forty-odd pages takes a second or two and
 * it is not free on a slow machine. That is why this lives on its own route
 * behind a progress state rather than running every time somebody opens the
 * report to read it on screen.
 *
 * Paged.js takes the source as HTML and rebuilds it into its own DOM. That is
 * destructive to React, which is fine here and only here: this route renders a
 * finished document once and never updates it. Nothing below is interactive.
 */
export function Paginate({
  children,
  css,
  /** Fire the print dialogue once pagination finishes. */
  autoPrint = false,
}: {
  children: React.ReactNode;
  /**
   * The paged stylesheet, as text.
   *
   * Handed to Paged.js rather than left in the document, because the `Previewer`
   * API only parses sheets it is given — unlike the auto-running polyfill, it
   * does not go looking through `document.styleSheets`. A `@page` rule sitting
   * in a `<style>` tag on the page is invisible to it, which is why the first
   * attempt produced perfectly sized pages with empty margin boxes.
   */
  css: string;
  autoPrint?: boolean;
}) {
  const source = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  /*
    One pagination per mount, ever.

    React runs effects twice in development, and Paged.js has no idea. Two
    Previewers rendering into the same container race each other and neither
    finishes: no pages, no error, the tab pinned, forever. The cleanup function
    cannot help — it can stop us reacting to a result, but it cannot stop a
    preview already walking the document.

    A ref survives the remount that a piece of state would not, so it is the only
    thing that can refuse the second run.
  */
  const started = useRef(false);
  const [pages, setPages] = useState<number | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = source.current;
    const into = target.current;
    if (!from || !into) return;
    if (started.current) return;
    started.current = true;

    // Anything a previous attempt left behind, in case this ever runs twice.
    into.replaceChildren();

    (async () => {
      try {
        /*
          The prebuilt bundle, not the package entry.

          `import 'pagedjs'` resolves to its ESM *source*, which pulls in
          `event-emitter` and `es5-ext`; under Turbopack's interop that shim
          arrives in a shape where `contains.call` is not a function, and
          Paged.js dies constructing its handlers before it has laid out a
          single page. `dist/paged.esm.js` is the same library with its
          dependencies already resolved into it, so there is no interop left to
          get wrong.

          Loaded here rather than at module scope: it touches `window` on load,
          and it is ~900KB that no other route should pay for.
        */
        const { Previewer } = await import('pagedjs');
        if (cancelled) return;

        const previewer = new Previewer();
        // `{ name: text }` is the documented shape for passing a sheet inline;
        // a bare string would be fetched as a URL instead.
        const paginating = previewer.preview(from.innerHTML, [{ 'report-paged': css }], into);

        /*
          A deadline, because this library fails by not finishing.

          Paged.js has two failure modes here and neither of them throws. It can
          loop on an element it cannot place, emitting pages until the tab dies —
          that is how a forty page report came out at two thousand. And it can
          stall before emitting anything at all, which it has done on this
          document on a trivial two-element case with a six-line stylesheet, on a
          clean build and a fresh tab, with every variable eliminated one at a
          time.

          Neither is acceptable behaviour for a button somebody presses to get a
          PDF. So pagination gets a deadline, and missing it is a normal outcome
          rather than a crash: the report is still on screen, still styled, still
          printable by the browser's own pagination. What is lost is the page
          numbering and the guarantee of equal page heights, and the reader is
          told exactly that rather than left watching a spinner.
        */
        const flow = await Promise.race([
          paginating,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), PAGINATION_DEADLINE_MS)),
        ]);
        if (cancelled) return;

        if (flow === null) {
          into.replaceChildren();
          setFailed(
            'This report could not be laid out into numbered pages in time, so it ' +
              'is shown as one continuous document. Printing still works and every ' +
              'section still starts on a new page; only the page numbering is missing.',
          );
          return;
        }

        // The source is now duplicated inside the paginated output, so it goes.
        from.remove();
        setRunningHeaders(into);
        fillContents(into);
        setPages(flow.total);

        /*
          A guard, because this failed once in a way nothing caught.

          An unbreakable box taller than the page makes Paged.js push it to a
          fresh page forever, and the only symptom is a document with thousands
          of pages in it — no error, no warning, just a browser slowly filling
          memory. Forty-odd pages is the expected size; an order of magnitude
          past that is a bug, and it should say so rather than be discovered by
          somebody printing it.
        */
        if (flow.total > RUNAWAY_PAGES) {
          setFailed(
            `Pagination produced ${flow.total} pages, which is far more than this ` +
              `report should ever be. Something in it cannot fit on a page and ` +
              `cannot be broken across two.`,
          );
        }

        if (autoPrint) {
          // One frame, so the pages are painted before the dialogue captures them.
          requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
        }
      } catch (error) {
        /*
          Paginating failed. The document is still in the DOM and still readable,
          so the honest fallback is to leave it alone and say so — a blank page
          would be a worse outcome than an unpaginated one.
        */
        if (!cancelled) setFailed(String((error as Error)?.stack ?? error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [autoPrint, css]);

  return (
    <>
      {pages === null && failed === null && (
        <p className="pagination-status no-print" role="status">
          Laying the report out into pages…
        </p>
      )}

      {failed !== null && (
        <p className="pagination-status no-print" role="status">
          The report could not be paginated in this browser, so it is shown as one
          continuous document. Printing still works; the page numbering will not.
          <span data-pagination-error style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
            {failed}
          </span>
        </p>
      )}

      <div ref={source} className="report-source">
        {children}
      </div>
      <div ref={target} className="report-pages" />
    </>
  );
}

/**
 * Write each page's running header.
 *
 * The spec mechanism for this is a named string — `string-set` on the heading,
 * `string(section)` in the margin box — and Paged.js implements it by compiling
 * the margin box down to a custom property it fills in per page. On this
 * document it filled every page with `undefined`: the handler never captured the
 * heading text, and the feature is thin enough on documentation that chasing it
 * further was worth less than doing it plainly.
 *
 * So this does it plainly, with the same semantics a running header has: a page
 * is labelled with the section that starts on it, or, if none does, with the one
 * that carried onto it. Covers and part dividers are labelled with nothing,
 * because a running header on a title page is furniture nobody asked for.
 *
 * Deterministic and inspectable, which the named string was not.
 */
function setRunningHeaders(root: HTMLElement) {
  let current = '';

  for (const page of root.querySelectorAll<HTMLElement>('.pagedjs_page')) {
    if (page.querySelector('.rp-plate')) {
      // A plate is its own title; it carries no header and ends the run. The
      // attribute is what the stylesheet hides its margin boxes by — see the
      // note there on why this is not a named page.
      page.dataset.plate = '';
      current = '';
    } else {
      const startsHere = page.querySelector('.rp-section-title');
      if (startsHere?.textContent) current = startsHere.textContent.trim();
    }

    page.style.setProperty('--rp-running', JSON.stringify(current));
  }
}

/**
 * How many pages is obviously wrong.
 *
 * The report runs to roughly forty-five. Two hundred is not a size it can reach
 * by any legitimate chart, so crossing it means an element is looping rather
 * than flowing.
 */
const RUNAWAY_PAGES = 200;

/**
 * How long pagination gets before it is abandoned.
 *
 * The one run that did complete took about twenty seconds for forty-six pages on
 * this machine, so thirty is generous without making a failure painful to sit
 * through. This is not a performance budget — it is the line past which the
 * library is not thinking, it is stuck.
 */
const PAGINATION_DEADLINE_MS = 30_000;

/**
 * Write the real page number against each contents entry.
 *
 * The spec mechanism, 'target-counter', asks the paginator to resolve every
 * cross-reference — and each resolution can change the contents page's own
 * length, which changes the numbers, which needs another pass. That is slow at
 * best and non-convergent at worst.
 *
 * Doing it afterwards is exact and costs one walk: every section carries its id,
 * every finished page knows its own number, so the answer is a lookup. The span
 * has its width reserved in CSS, so filling it cannot reflow the line.
 */
function fillContents(root: HTMLElement) {
  const pageOf = new Map<string, string>();

  for (const page of root.querySelectorAll<HTMLElement>('.pagedjs_page')) {
    const number = page.getAttribute('data-page-number');
    if (!number) continue;
    for (const target of page.querySelectorAll<HTMLElement>('[id]')) {
      if (!pageOf.has(target.id)) pageOf.set(target.id, number);
    }
  }

  for (const slot of root.querySelectorAll<HTMLElement>('.rp-toc-page')) {
    const id = slot.getAttribute('data-toc-for');
    slot.textContent = (id && pageOf.get(id)) || '';
  }
}

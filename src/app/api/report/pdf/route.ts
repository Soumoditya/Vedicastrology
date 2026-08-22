import { existsSync } from 'node:fs';
import type { NextRequest } from 'next/server';
import type { Page } from 'puppeteer-core';

import { resolveTheme } from '@/lib/report/themes';

/**
 * The report as an actual file.
 *
 * The button said "Download as PDF" and downloaded nothing: it was a link to the
 * print route that called `window.print()` and left the reader in a dialogue.
 * This route is the missing half. Headless Chrome loads the same
 * `/report/print` document a browser would, and returns the bytes.
 *
 * Doing it server-side is also what finally solves page numbering. Chrome has
 * never implemented CSS margin boxes, so `@bottom-center` prints nothing;
 * Paged.js implements them in JavaScript but stalled outright on this document.
 * `page.pdf()` has carried `headerTemplate`/`footerTemplate` all along, and
 * Chrome fills in the number itself. One dependency replaces the whole polyfill,
 * and it cannot hang the reader's tab because it does not run there.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Forty-odd pages of charts is a few seconds of layout, not milliseconds. */
export const maxDuration = 60;

/*
  Chrome, told not to take the whole machine.

  A default launch spawns a zygote and a process per renderer and helper, and
  reserves shared memory it cannot get inside a container. Rendering one document
  and throwing the browser away does not need any of that. Without these the dev
  server was killed outright partway through a run of four reports, and the same
  pressure applies to a serverless function with a fixed memory ceiling.
*/
const LEAN_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--disable-extensions',
  '--disable-background-networking',
  '--js-flags=--max-old-space-size=512',
];

/** Where Chrome lives, when it is not the one we ship. */
const LOCAL_CHROME = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const theme = resolveTheme(url.searchParams.get('theme') ?? undefined);

  // The print route is gated behind the same feature flag and sign-in as the
  // report. Chrome arrives as a fresh client with no session, so the caller's
  // cookies have to travel with it or it renders the gate page instead.
  const cookie = request.headers.get('cookie') ?? '';

  const target = new URL('/report/print', originOf(request));
  url.searchParams.forEach((value, key) => {
    // 'name' is both the filename and the name printed on the cover, so it has
    // to travel. Dropping it here is what made every cover read 'Not given'.
    if (key !== 'inline') target.searchParams.set(key, value);
  });

  let browser;

  try {
    browser = await launch();

    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });

    await page.goto(target.toString(), { waitUntil: 'networkidle0', timeout: 45_000 });

    // Chart plates are data URIs and the night ground is a real fetch. Waiting
    // on decode rather than on load, because a decoded-but-unpainted image
    // still prints as a gap where a chart should be.
    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => img.decode().catch(() => undefined)),
      );
      await document.fonts.ready;
    });

    // Print emulation first, so what is measured below is the printed layout
    // rather than the screen one.
    await page.emulateMediaType('print');

    const margin = parseMargin(theme.style.pageMargin);
    const options = {
      format: 'A4' as const,
      printBackground: true,
      displayHeaderFooter: true,
      margin,
      headerTemplate: '<span></span>',
      footerTemplate: footer(theme.muted),
    };

    /*
      Two passes, because the contents page has to state a fact nobody can
      compute in advance.

      Chrome implements no target-counter, so the page an entry landed on is not
      reachable from CSS. Simulating the fragmenter in JavaScript was tried twice
      and was wrong twice — first by a wide margin, because every section forced
      a break and abandoned the rest of its page, then by a page or two once
      break-inside had to be honoured as well. A contents page that is nearly
      right is worse than one that says nothing.

      So the document is printed, the finished PDF is asked where its own links
      point, and it is printed again with the answers written in. Chrome emits a
      real GoTo destination for every in-page anchor, so this is the document's
      own account of itself rather than a model of it. The second pass reuses the
      loaded page, so it costs a re-print and not a re-render.
    */
    const firstPass = await page.pdf(options);
    const pages = await contentsPages(firstPass);
    if (pages.length) {
      await page.evaluate((numbers: number[]) => {
        document.querySelectorAll('.rp-toc-page').forEach((slot, i) => {
          if (numbers[i]) slot.textContent = String(numbers[i]);
        });
      }, pages);
    }

    const pdf = pages.length ? await page.pdf(options) : firstPass;

    const name = safeFileName(url.searchParams.get('name') ?? '');
    const disposition = url.searchParams.get('inline') === '1' ? 'inline' : 'attachment';

    return new Response(pdf as unknown as BodyInit, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': disposition + '; filename="' + name + '.pdf"',
        'cache-control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'PDF render failed' }, 500);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

/**
 * A browser, from whichever source this environment has one.
 *
 * On Vercel that is the brotli-packed Chromium unpacked to /tmp at cold start.
 * Locally it is whatever Chrome the developer already has, because a second
 * 150MB download to render a page they can already see would be absurd.
 */
async function launch() {
  const puppeteer = await import('puppeteer-core');

  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const executablePath = LOCAL_CHROME.find((p): p is string => Boolean(p) && existsSync(p!));
  if (!executablePath) {
    throw new Error('No local Chrome found. Set PUPPETEER_EXECUTABLE_PATH to one.');
  }
  return puppeteer.launch({ executablePath, headless: true, args: LEAN_ARGS });
}

/**
 * Ask a finished PDF which page each contents entry points at.
 *
 * The entries are anchors, so Chrome writes a link annotation for each with a
 * GoTo destination. Reading them back gives the true page — no layout model, no
 * drift — and the annotations come out in document order, which is the order the
 * contents lists them in.
 */
async function contentsPages(bytes: Uint8Array): Promise<number[]> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: false }).promise;

    for (let n = 1; n <= Math.min(doc.numPages, 4); n += 1) {
      const page = await doc.getPage(n);
      const links = (await page.getAnnotations())
        .filter((a) => a.subtype === 'Link' && a.dest)
        .sort((x, y) => (y.rect?.[1] ?? 0) - (x.rect?.[1] ?? 0));
      if (links.length < 4) continue;

      const numbers: number[] = [];
      for (const link of links) {
        const dest = typeof link.dest === 'string' ? await doc.getDestination(link.dest) : link.dest;
        const ref = Array.isArray(dest) ? dest[0] : null;
        if (!ref) { numbers.push(0); continue; }
        numbers.push((await doc.getPageIndex(ref)) + 1);
      }
      return numbers;
    }
  } catch (error) {
    // A contents page with blank numbers is a smaller failure than no download,
    // but it must not be a silent one: this failing quietly is exactly how the
    // numbers went missing the first time.
    console.error('[report/pdf] could not read contents destinations:', error);
  }
  return [];
}

function footer(colour: string): string {
  return (
    '<div style="width:100%;font-size:7.5pt;color:' +
    colour +
    ';font-family:Georgia,serif;padding:0 14mm;display:flex;justify-content:space-between;">' +
    '<span>vedicastrologey.com</span>' +
    '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>' +
    '</div>'
  );
}

/** `16mm 15mm 18mm` and friends, expanded the way Chrome wants them. */
function parseMargin(shorthand: string) {
  const p = shorthand.trim().split(/\s+/);
  const [top, right, bottom, left] =
    p.length === 1
      ? [p[0], p[0], p[0], p[0]]
      : p.length === 2
        ? [p[0], p[1], p[0], p[1]]
        : p.length === 3
          ? [p[0], p[1], p[2], p[1]]
          : [p[0], p[1], p[2], p[3]];
  return { top, right, bottom, left };
}

function mm(value: string): number {
  return Number.parseFloat(value) || 0;
}

function originOf(request: NextRequest): string {
  if (process.env.VERCEL_URL) return 'https://' + process.env.VERCEL_URL;
  return new URL(request.url).origin;
}

/** A filename ends up in a header, so it may not carry quotes or newlines. */
function safeFileName(raw: string): string {
  const cleaned = raw
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .slice(0, 60);
  return cleaned ? cleaned.replace(/\s+/g, '-') + '-kundali' : 'kundali';
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

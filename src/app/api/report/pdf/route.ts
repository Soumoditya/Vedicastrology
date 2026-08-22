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
    if (key !== 'inline' && key !== 'name') target.searchParams.set(key, value);
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
    await fillContentsPageNumbers(page, margin);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      margin,
      headerTemplate: '<span></span>',
      footerTemplate: footer(theme.muted),
    });

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
 * Write the real page number against every contents entry.
 *
 * The spec answer is target-counter(attr(href url), page), which Chrome does not
 * implement, so the number has to be worked out rather than read.
 *
 * Dividing a section's offset by the page height is the obvious way and it is
 * wrong: every section carries break-before, so each one abandons whatever was
 * left of the previous page, and measuring the flow as if it were continuous
 * undercounts by however much of that space went unused. On this report that was
 * 29 against a true 47.
 *
 * Walking the blocks the way the fragmenter does costs nothing and is exact:
 * a block that forces a break starts a new page, then consumes as many as its
 * own height needs. Checked against the finished PDF, it agrees to the page.
 */
async function fillContentsPageNumbers(
  page: Page,
  margin: { top: string; bottom: string },
) {
  const A4_HEIGHT_MM = 297;
  const contentMm = A4_HEIGHT_MM - mm(margin.top) - mm(margin.bottom);

  await page.evaluate((contentHeightMm: number) => {
    const PX_PER_MM = 96 / 25.4;
    const perPage = contentHeightMm * PX_PER_MM;

    const doc = document.querySelector('.rp-doc');
    if (!doc) return;

    const pageOf = new Map<Element, number>();
    let current = 1;
    let first = true;
    for (const block of Array.from(doc.children)) {
      if (getComputedStyle(block).breakBefore === 'page' && !first) current += 1;
      first = false;
      pageOf.set(block, current);
      const height = block.getBoundingClientRect().height;
      current += Math.max(1, Math.ceil(height / perPage)) - 1;
    }

    document.querySelectorAll<HTMLAnchorElement>('.rp-toc a[href^="#"]').forEach((link) => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      const slot = link.parentElement?.querySelector('.rp-toc-page');
      if (!target || !slot) return;
      // The contents links at a heading; the page belongs to its top-level block.
      let block: Element | null = target;
      while (block && block.parentElement !== doc) block = block.parentElement;
      const number = block ? pageOf.get(block) : undefined;
      if (number) slot.textContent = String(number);
    });
  }, contentMm);
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

/**
 * Render pages of a PDF to PNGs, so they can actually be looked at.
 *
 *   node scripts/pdf-pages.mjs <file.pdf> <outDir> [firstPage] [lastPage]
 *
 * Written because a run of "47 pages, correct fonts, correct page numbers" was
 * reported as verified while the pages themselves had never been opened. Counts
 * and font tables say nothing about whether a chart is cut in half or a heading
 * is stranded on an otherwise empty sheet.
 */
import { mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const [, , src, outDir = 'pdf-pages', first = '1', last = '12'] = process.argv;
if (!src) {
  console.error('usage: node scripts/pdf-pages.mjs <file.pdf> <outDir> [first] [last]');
  process.exit(1);
}

const CHROME = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find(Boolean);

mkdirSync(outDir, { recursive: true });

// pdf.js and the PDF both have to be same-origin for the worker, so everything
// is staged under public/ and served by the dev server, then removed.
const stage = 'public/_pdfview';
mkdirSync(stage, { recursive: true });
copyFileSync('node_modules/pdfjs-dist/build/pdf.min.mjs', `${stage}/pdf.mjs`);
copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', `${stage}/pdf.worker.mjs`);
copyFileSync(resolve(src), `${stage}/doc.pdf`);

const html = `<!doctype html><meta charset="utf-8">
<style>body{margin:0;background:#888}canvas{display:block;margin:0 auto 8px}</style>
<script type="module">
import * as pdfjs from '/_pdfview/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = '/_pdfview/pdf.worker.mjs';
window.ready = (async () => {
  const doc = await pdfjs.getDocument({ url: '/_pdfview/doc.pdf' }).promise;
  window.pageCount = doc.numPages;
  window.renderPage = async (n) => {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    canvas.id = 'p' + n;
    document.body.replaceChildren(canvas);
    const ctx = canvas.getContext('2d');
    // Paint a ground first: an unpainted canvas is transparent, and a screenshot
    // of transparency reads as black, which looks exactly like a page-background
    // bug that is not there.
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return [canvas.width, canvas.height];
  };
  return true;
})();
</script>`;
writeFileSync(`${stage}/index.html`, html);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.goto('http://localhost:3100/_pdfview/index.html', { waitUntil: 'networkidle0' });
await page.evaluate(() => window.ready);
const count = await page.evaluate(() => window.pageCount);
console.log('pages in document:', count);

const to = Math.min(Number(last), count);
for (let n = Number(first); n <= to; n += 1) {
  const [w, h] = await page.evaluate((i) => window.renderPage(i), n);
  await page.setViewport({ width: Math.ceil(w), height: Math.ceil(h) });
  const el = await page.$('canvas');
  const file = `${outDir}/page-${String(n).padStart(2, '0')}.png`;
  await el.screenshot({ path: file });
  console.log('wrote', file);
}
await browser.close();

// The stage lives inside public/, so leaving it behind means the dev server
// serves a copy of pdf.js and the linter reads it as project source.
rmSync(stage, { recursive: true, force: true });

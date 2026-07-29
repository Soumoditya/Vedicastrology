import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getRegions, resolveRegion } from '@/lib/pricing/region';

/**
 * Applies the stored theme before the first paint.
 *
 * Without this the page would render dark, then snap to light for anyone who
 * chose light mode, a visible flash on every navigation. It has to be inline
 * and synchronous to run ahead of paint.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || 'dark';
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Fetched once here rather than in every page that shows a price.
  const [regions, currentRegion] = await Promise.all([getRegions(), resolveRegion()]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <Header regions={regions} currentRegion={currentRegion} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

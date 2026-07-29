import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';

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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

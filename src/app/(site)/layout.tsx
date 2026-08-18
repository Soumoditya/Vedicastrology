import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getRegions, resolveRegion } from '@/lib/pricing/region';
import { getProfile } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';

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

/** Nav labels, keyed by href so the Header does not need to know the dictionary. */
async function navLabels() {
  const { t, locale } = await getT();
  return {
    locale,
    labels: {
      '/tools': t('nav.tools'),
      '/services': t('nav.services'),
      '/blog': t('nav.journal'),
      '/about': t('nav.about'),
      'nav.book': t('nav.book'),
      'nav.signIn': t('nav.signIn'),
      'nav.signInLong': t('nav.signInLong'),
      'nav.charts': t('nav.charts'),
      'nav.settings': t('nav.settings'),
      'nav.admin': t('nav.admin'),
      'nav.signOut': t('nav.signOut'),
      'nav.account': t('nav.account'),
      'nav.menuOpen': t('nav.menuOpen'),
      'nav.menuClose': t('nav.menuClose'),
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Fetched once here rather than in every page that shows a price.
  const [regions, currentRegion, profile, nav] = await Promise.all([
    getRegions(),
    resolveRegion(),
    getProfile(),
    navLabels(),
  ]);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <Header
        regions={regions}
        currentRegion={currentRegion}
        account={{
          signedIn: Boolean(profile),
          displayName: profile?.display_name ?? null,
          isAdmin: profile?.role === 'admin',
        }}
        locale={nav.locale}
        labels={nav.labels}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

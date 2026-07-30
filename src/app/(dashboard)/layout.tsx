import { redirect } from 'next/navigation';

import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { getRegions, resolveRegion } from '@/lib/pricing/region';
import { getProfile } from '@/lib/supabase/server';

/**
 * The dashboard had no layout at all.
 *
 * Everything under it rendered against the root layout alone, which means no
 * header, no navigation and no way back to the rest of the site. Somebody
 * signing up landed on a bare page and could reasonably conclude the account
 * had not worked. The site header belongs here for the same reason it belongs
 * on every other page.
 */
const themeScript = `
(function () {
  try {
    document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, regions, currentRegion] = await Promise.all([
    getProfile(),
    getRegions(),
    resolveRegion(),
  ]);

  // Row level security would refuse the queries anyway, but failing here sends
  // somebody to sign in instead of showing them an empty page.
  if (!profile) redirect('/login?next=/dashboard');

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <Header
        regions={regions}
        currentRegion={currentRegion}
        account={{
          signedIn: true,
          displayName: profile.display_name,
          isAdmin: profile.role === 'admin',
        }}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">{children}</div>
      </main>
      <Footer />
    </>
  );
}

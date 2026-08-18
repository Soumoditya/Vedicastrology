import { redirect } from 'next/navigation';

import { getProfile } from '@/lib/supabase/server';

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
  const profile = await getProfile();
  if (!profile) redirect('/login?next=/dashboard');

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {/*
        No second header.

        There was one here — wordmark on the left, Admin and Sign out on the
        right — sitting directly beneath the site header that the parent layout
        already renders. Two stacked bars, two wordmarks, and the sign-out control
        duplicated between this bar and the account menu above it. Everything it
        offered is in the account menu, including Admin, so the dashboard is just
        the dashboard now.
      */}
      {/*
        `min-h-screen` used to sit here, on a wrapper that already lives below the
        site header, so the content area was a full viewport tall *plus* the header
        and the page opened with a large gap above "Welcome back". The parent
        layout already makes this region grow; this only needs the same measure and
        rhythm the tool pages use, so moving between them does not feel like
        landing on a different site.
      */}
      <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">{children}</main>
    </>
  );
}

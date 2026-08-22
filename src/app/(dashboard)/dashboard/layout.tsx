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
        No wrapper of its own.

        This had `min-h-screen` and then, after that was removed, its own
        `max-w-5xl px-5 pt-10 pb-12 sm:pt-12 sm:pb-16` — while the parent layout at
        `(dashboard)/layout.tsx` already wraps children in exactly that. Two
        identical frames nested inside each other means the padding applies twice,
        which is where the 128px of dead space above "Welcome back" came from. The
        parent owns the measure; this owns nothing.
      */}
      {children}
    </>
  );
}

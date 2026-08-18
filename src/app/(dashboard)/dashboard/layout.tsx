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
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>
      </div>
    </>
  );
}

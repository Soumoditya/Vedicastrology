import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getProfile } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';
import { Wordmark } from '@/components/site/Wordmark';

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
      <div className="flex min-h-screen flex-col">
        <header className="border-b" style={{ background: 'var(--surface-sunken)' }}>
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
            <Link href="/" aria-label="Home">
              <Wordmark />
            </Link>
            <div className="flex items-center gap-4">
              {profile.role === 'admin' && (
                <Link href="/admin" className="text-xs" style={{ color: 'var(--color-gold-400)' }}>
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button type="submit" className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>
      </div>
    </>
  );
}

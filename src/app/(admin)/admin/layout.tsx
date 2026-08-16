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

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/regions', label: 'Regions & currencies' },
  { href: '/admin/posts', label: 'Journal' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/research', label: 'Research' },
  { href: '/admin/readings', label: 'Readings' },
  { href: '/admin/features', label: 'Features' },
];

/**
 * The real admin gate.
 *
 * The middleware only checks that someone is signed in, because verifying the
 * role there would mean a database round trip on every single request. This is
 * where the role is actually checked, and behind it, row level security would
 * refuse the queries regardless, so a mistake here cannot expose data.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) redirect('/login?next=/admin');
  if (profile.role !== 'admin') redirect('/dashboard');

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <div className="flex min-h-screen flex-col">
        <header
          className="sticky top-0 z-40 border-b"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-4">
              <Link href="/" aria-label="Vedic Astrologey home">
                <Wordmark compact />
              </Link>
              <span
                className="rounded-full border px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.16em]"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--color-gold-300)',
                }}
              >
                Admin
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 lg:flex-row">
          <nav className="lg:w-52 lg:shrink-0">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}

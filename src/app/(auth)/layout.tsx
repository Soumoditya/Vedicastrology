import Link from 'next/link';

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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <div className="relative flex min-h-screen flex-col">
        <div className="starfield" aria-hidden />

        <header className="relative mx-auto w-full max-w-6xl px-5 py-6">
          <Link href="/" aria-label="Vedic Astrologey home">
            <Wordmark />
          </Link>
        </header>

        <main className="relative mx-auto flex w-full max-w-md flex-1 items-center px-5 pb-16">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </>
  );
}

import Link from 'next/link';

import { canUse, refusalMessage } from '@/lib/features/flags';

/**
 * A closed door, and a reason.
 *
 * Renders its children when the visitor may use the capability, and a short
 * panel when they may not. The panel says which thing is unavailable and what
 * would change that, because a gate that only says no reads as a fault rather
 * than a decision.
 *
 * `next` carries the current path so signing in returns to where the person
 * already was, instead of dropping them on a dashboard to find their way back.
 */
export async function FeatureGate({
  feature,
  next,
  children,
}: {
  feature: string;
  next?: string;
  children: React.ReactNode;
}) {
  const refusal = await gateFor(feature, next);
  return refusal ?? <>{children}</>;
}

/**
 * The same check for a page that would rather return early than nest.
 *
 * Returns the refusal panel when access is denied and null when it is not, so
 * a page reads `const gate = await gateFor(...); if (gate) return gate;` before
 * doing any work. That ordering matters: a gated page should not compute a
 * chart it is about to refuse to show.
 */
export async function gateFor(
  feature: string,
  next?: string,
): Promise<React.ReactElement | null> {
  const access = await canUse(feature);

  if (access.allowed) return null;

  const signInHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <div className="surface-card mx-auto my-16 max-w-lg p-8 text-center">
      <p className="eyebrow">{access.flag?.label ?? 'Unavailable'}</p>
      <p
        className="font-display mt-4 text-2xl leading-snug"
        style={{ color: 'var(--text-primary)' }}
      >
        {refusalMessage(access)}
      </p>

      {access.flag?.description && (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {access.flag.description}
        </p>
      )}

      {access.reason === 'needs_account' && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="rounded-full px-5 py-2.5 text-sm font-medium"
            style={{
              background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
              color: '#150e00',
            }}
          >
            Create an account
          </Link>
          <Link
            href={signInHref}
            className="rounded-full border px-5 py-2.5 text-sm"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Sign in
          </Link>
        </div>
      )}

      {access.reason === 'needs_premium' && (
        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Membership is not open yet. It will be, and this is one of the things
          it includes.
        </p>
      )}

      <p className="mt-8 text-xs">
        <Link href="/tools" style={{ color: 'var(--color-gold-400)' }}>
          Back to the free tools
        </Link>
      </p>
    </div>
  );
}

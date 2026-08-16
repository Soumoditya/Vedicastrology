import { createClient } from '@/lib/supabase/server';
import { FeatureFlagRow } from '@/components/admin/FeatureFlagRow';
import type { FeatureFlag } from '@/lib/supabase/types';

export const metadata = { title: 'Features', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminFeatures() {
  const supabase = await createClient();
  const { data } = await supabase.from('feature_flags').select('*').order('sort_order');
  const flags = (data as FeatureFlag[] | null) ?? [];

  const groups: { tier: FeatureFlag['tier']; title: string; blurb: string }[] = [
    {
      tier: 'free',
      title: 'Open to everyone',
      blurb: 'No account needed. This is what brings people to the site.',
    },
    {
      tier: 'account',
      title: 'Needs an account',
      blurb: 'Free to sign up. Worth using for anything that has to be remembered.',
    },
    {
      tier: 'premium',
      title: 'Membership',
      blurb: 'Only paying members. Nobody has one yet, so this is currently you alone.',
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
        Features
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Move any capability between free, account and membership. It takes
        effect immediately, everywhere, with no deployment. Change your mind as
        often as you like.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        The switch on the right is different from the tier. Turning something
        off hides it from everybody, including you, which is what you want for
        something half-built or misbehaving.
      </p>

      {groups.map((group) => {
        const rows = flags.filter((f) => f.tier === group.tier);
        if (rows.length === 0) return null;

        return (
          <section key={group.tier} className="mt-9">
            <h2 className="eyebrow">{group.title}</h2>
            <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {group.blurb}
            </p>
            <div className="mt-4 space-y-2">
              {rows.map((flag) => (
                <FeatureFlagRow key={flag.key} flag={flag} />
              ))}
            </div>
          </section>
        );
      })}

      {flags.length === 0 && (
        <p className="surface-card mt-8 p-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          No features registered yet.
        </p>
      )}
    </div>
  );
}

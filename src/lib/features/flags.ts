import 'server-only';

import { cache } from 'react';

import { createClient, getProfile } from '@/lib/supabase/server';
import type { FeatureFlag, FeatureTier } from '@/lib/supabase/types';

/**
 * Feature gating.
 *
 * Which tier a capability needs lives in the database, not in these functions,
 * so moving something between free, account-only and premium is a dropdown in
 * the admin panel rather than a deployment. Code asks one question, `canUse`,
 * and never encodes the answer.
 *
 * Two separate ideas are kept apart on purpose:
 *
 *   `tier` is who is allowed to use a capability. A business decision.
 *   `enabled` is whether it works at all. A kill switch for something broken
 *   or not yet finished.
 *
 * A disabled feature is unavailable to everybody including the administrator,
 * because the point of a kill switch is that it stops the thing, and an
 * exception for one account defeats it.
 */

/** What a visitor is entitled to, in increasing order. */
export type ViewerTier = 'anon' | 'account' | 'premium';

const RANK: Record<ViewerTier, number> = { anon: 0, account: 1, premium: 2 };

const REQUIRED: Record<FeatureTier, ViewerTier> = {
  free: 'anon',
  account: 'account',
  premium: 'premium',
};

/**
 * All flags, keyed.
 *
 * Cached per request. A page that checks six capabilities should cost one
 * query, not six, and `cache` deduplicates within a single render pass without
 * holding a value across requests, which would make an admin change invisible
 * until a redeploy.
 */
export const getFlags = cache(async (): Promise<Map<string, FeatureFlag>> => {
  const supabase = await createClient();
  const { data } = await supabase.from('feature_flags').select('*').order('sort_order');

  return new Map((data ?? []).map((flag) => [flag.key, flag as FeatureFlag]));
});

/**
 * The current visitor's tier.
 *
 * Premium is asked of the database rather than worked out here, because the
 * same rule has to hold for row level security, and two implementations of one
 * rule eventually disagree.
 */
export const getViewerTier = cache(async (): Promise<ViewerTier> => {
  const profile = await getProfile();
  if (!profile) return 'anon';

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('has_premium');

  // A failed check must not hand out access. Falling back to 'account' means a
  // transient database error costs somebody a feature for one request rather
  // than opening the paid tier to everybody.
  if (error) return 'account';

  return data === true ? 'premium' : 'account';
});

export interface FeatureAccess {
  allowed: boolean;
  /** Present when access is refused, so the interface can say why. */
  reason?: 'disabled' | 'needs_account' | 'needs_premium' | 'unknown_feature';
  flag?: FeatureFlag;
}

/**
 * Whether the current visitor may use a capability.
 *
 * An unknown key is refused rather than allowed. A typo should make a feature
 * disappear, which is noticed immediately, instead of quietly ungating a paid
 * one, which is not noticed until it costs money.
 */
export async function canUse(key: string): Promise<FeatureAccess> {
  const [flags, tier] = await Promise.all([getFlags(), getViewerTier()]);
  const flag = flags.get(key);

  if (!flag) return { allowed: false, reason: 'unknown_feature' };
  if (!flag.enabled) return { allowed: false, reason: 'disabled', flag };

  const required = REQUIRED[flag.tier];
  if (RANK[tier] >= RANK[required]) return { allowed: true, flag };

  return {
    allowed: false,
    reason: required === 'premium' ? 'needs_premium' : 'needs_account',
    flag,
  };
}

/** Convenience for the common case where only the boolean matters. */
export async function allowed(key: string): Promise<boolean> {
  return (await canUse(key)).allowed;
}

/**
 * Check several capabilities at once.
 *
 * Still a single query, since `getFlags` and `getViewerTier` are both cached
 * for the request.
 */
export async function canUseAll(
  keys: string[],
): Promise<Record<string, FeatureAccess>> {
  const entries = await Promise.all(
    keys.map(async (key) => [key, await canUse(key)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * The dictionary key for a refusal.
 *
 * A key rather than a sentence, so every gate on the site says the same thing
 * in whichever language the visitor is reading. Centralising it here is what
 * makes translating all of them a single change.
 */
export function refusalKey(access: FeatureAccess): string {
  switch (access.reason) {
    case 'needs_account':
      return 'gate.needsAccount';
    case 'needs_premium':
      return 'gate.needsPremium';
    case 'disabled':
      return 'gate.disabled';
    default:
      return 'gate.unavailable';
  }
}

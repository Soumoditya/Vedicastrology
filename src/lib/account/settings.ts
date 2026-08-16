import 'server-only';

import { cache } from 'react';

import { createClient, getUser } from '@/lib/supabase/server';
import type { UserSettings } from '@/lib/supabase/types';

/**
 * Account settings.
 *
 * Every value has a working default, and a person who has never opened the
 * settings page has no row at all. Reading therefore always returns a complete
 * object rather than nulls, so nothing downstream has to decide what a missing
 * preference means.
 */

export const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  chart_style: 'north',
  ayanamsa: 'lahiri',
  house_system: 'whole_sign',
  node_type: 'mean',
  language: 'en',
  theme: 'dark',
  timezone: null,
};

export type Settings = typeof DEFAULT_SETTINGS;

/** The signed-in visitor's settings, or the defaults when signed out. */
export const getSettings = cache(async (): Promise<Settings> => {
  const user = await getUser();
  if (!user) return DEFAULT_SETTINGS;

  const supabase = await createClient();
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return DEFAULT_SETTINGS;

  // Spread over the defaults rather than trusting the row to be complete. A
  // column added later is then already handled everywhere.
  return { ...DEFAULT_SETTINGS, ...(data as UserSettings) };
});

/** The saved chart style in the form the chart component expects. */
export function chartStyleFor(settings: Settings): 'north-indian' | 'south-indian' {
  return settings.chart_style === 'south' ? 'south-indian' : 'north-indian';
}

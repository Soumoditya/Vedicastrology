import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Server Supabase client, scoped to the signed-in visitor.
 *
 * Still the publishable key, so row level security applies exactly as it does
 * in the browser. This is deliberate: server code has no implicit authority
 * here, and a bug in a page cannot leak another user's rows.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. The middleware refreshes
            // the session on every request, so this is safe to ignore here.
          }
        },
      },
    },
  );
}

/**
 * Service-role client — bypasses row level security entirely.
 *
 * Reserved for work that genuinely has no acting user: recording a payment
 * webhook, or a scheduled job. Never call this in response to input from a
 * visitor without first checking who they are, and never expose its results
 * directly.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. It must never be exposed to the browser.',
    );
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/** The signed-in user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * The signed-in user's profile, including their role.
 * Returns null when signed out.
 */
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

/** Whether the current visitor is an admin. Used to gate /admin. */
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === 'admin';
}

'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

/**
 * Authentication server actions.
 *
 * All of these return a plain `{ error }` object rather than throwing, so the
 * forms can show a message in place without losing what the visitor typed.
 */

export interface AuthState {
  error?: string;
  message?: string;
}

const credentials = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

/** Where Supabase should send people back to after an email link. */
async function callbackUrl(next: string): Promise<string> {
  const headerList = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${headerList.get('host') ?? 'localhost:3000'}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const displayName = (formData.get('display_name') as string | null)?.trim();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: await callbackUrl('/dashboard'),
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) return { error: error.message };

  return {
    message:
      'Check your inbox — we have sent you a link to confirm your address.',
  };
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase deliberately does not distinguish "no such account" from "wrong
    // password", and neither do we — saying which would let anyone test
    // whether a given address has an account here.
    return { error: 'That email and password do not match an account.' };
  }

  const next = (formData.get('next') as string | null) ?? '/dashboard';
  revalidatePath('/', 'layout');
  redirect(safeNext(next));
}

/** Passwordless sign-in, for people who would rather not keep a password. */
export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = z.string().email().safeParse(formData.get('email'));
  if (!email.success) return { error: 'Please enter a valid email address.' };

  const next = (formData.get('next') as string | null) ?? '/dashboard';
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl(safeNext(next)) },
  });

  if (error) return { error: error.message };

  return { message: 'Check your inbox — your sign-in link is on its way.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Only ever redirect within this site.
 *
 * `next` comes from the query string, so without this check an attacker could
 * craft a link that signs someone in and then bounces them to another domain —
 * an open redirect, and a convincing one because the first hop is genuine.
 */
function safeNext(next: string): string {
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  return next;
}

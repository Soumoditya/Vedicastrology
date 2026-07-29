import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Exchanges the one-time code from a confirmation or magic-link email for a
 * session, then sends the visitor on to wherever they were headed.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Only ever redirect within this site — `next` arrives from the URL, so an
  // unchecked value would make this an open redirect off the back of a genuine
  // sign-in.
  const destination = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}

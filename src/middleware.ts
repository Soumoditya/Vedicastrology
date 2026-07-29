import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';
import { REGION_COOKIE } from '@/lib/pricing/region';

/**
 * Runs on every request that isn't a static asset.
 *
 * Two jobs: keep the auth session alive, and record which pricing region the
 * visitor falls into so pages can render the right currency without an extra
 * lookup.
 *
 * The /admin gate here is a first line only, it checks that someone is signed
 * in, not that they are an admin, because verifying the role means a database
 * round trip on every request. The real check is the role test in the admin
 * layout, backed by row level security that would refuse the queries anyway.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Record the detected country once, so pages can resolve a region without
  // re-reading edge headers. An explicit choice from the currency switcher
  // already lives in this cookie and must not be overwritten.
  const country = request.headers.get('x-vercel-ip-country');
  if (country && !request.cookies.has(REGION_COOKIE)) {
    response.cookies.set('va_country', country.toUpperCase(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files, matching those would
     * add a pointless auth round trip to each one.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};

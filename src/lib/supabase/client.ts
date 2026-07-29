'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client.
 *
 * Uses the publishable key only. Every table is protected by row level
 * security, so this key grants exactly what an anonymous visitor is allowed:
 * published content, and the ability to submit an enquiry or a testimonial
 * that lands as `pending`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

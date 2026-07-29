import 'server-only';

import { cookies, headers } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import type {
  Region,
  Service,
  ServicePrice,
  ServiceWithPrice,
} from '@/lib/supabase/types';

/**
 * Region and price resolution.
 *
 * Prices are never converted. Each one is a figure typed by hand in the admin
 * panel for a specific region, because a consultation sold in India is not the
 * same product, commercially, as the same consultation sold abroad, and an
 * exchange rate would produce odd-looking numbers that undercut the pricing
 * decision.
 */

/** Cookie holding a visitor's explicit currency choice, by region code. */
export const REGION_COOKIE = 'va_region';

export async function getRegions(): Promise<Region[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('regions')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data as Region[] | null) ?? [];
}

/**
 * The region to price in, resolved in this order:
 *
 *   1. the visitor's explicit choice, from the currency switcher;
 *   2. the region listing their detected country;
 *   3. the region marked default;
 *   4. whatever region exists.
 *
 * The last two steps matter: a visitor whose country cannot be determined, * a VPN, a privacy browser, a crawler, still sees a price rather than a gap.
 */
export async function resolveRegion(): Promise<Region | null> {
  const regions = await getRegions();
  if (regions.length === 0) return null;

  const cookieStore = await cookies();

  const chosen = cookieStore.get(REGION_COOKIE)?.value;
  if (chosen) {
    const match = regions.find((r) => r.code === chosen);
    if (match) return match;
  }

  const country = cookieStore.get('va_country')?.value ?? (await detectCountry());
  if (country) {
    const match = regions.find((r) => r.country_codes.includes(country));
    if (match) return match;
  }

  return regions.find((r) => r.is_default) ?? regions[0];
}

/**
 * The visitor's country, from Vercel's edge geolocation header.
 * Available on every plan including Hobby; absent in local development.
 */
export async function detectCountry(): Promise<string | null> {
  const headerList = await headers();
  const country =
    headerList.get('x-vercel-ip-country') ?? headerList.get('cf-ipcountry');
  return country ? country.toUpperCase() : null;
}

// ---------------------------------------------------------------------------
// Services with prices
// ---------------------------------------------------------------------------

type PriceRow = ServicePrice & { region: Region };
type ServiceRow = Service & { service_prices: PriceRow[] };

/** Active services, each carrying the price for the visitor's region. */
export async function getServicesWithPrices(): Promise<ServiceWithPrice[]> {
  const supabase = await createClient();
  const region = await resolveRegion();

  const { data } = await supabase
    .from('services')
    .select('*, service_prices(*, region:regions(*))')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!data) return [];

  return (data as unknown as ServiceRow[]).map((service) =>
    withRegionalPrice(service, region),
  );
}

export async function getServiceBySlug(
  slug: string,
): Promise<ServiceWithPrice | null> {
  const supabase = await createClient();
  const region = await resolveRegion();

  const { data } = await supabase
    .from('services')
    .select('*, service_prices(*, region:regions(*))')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return null;
  return withRegionalPrice(data as unknown as ServiceRow, region);
}

/**
 * Attach the applicable price to a service.
 *
 * Falls back to the default region's price when the visitor's own region has
 * none set, better to show a real price in another currency, clearly
 * labelled, than to show nothing at all.
 */
function withRegionalPrice(
  service: ServiceRow,
  region: Region | null,
): ServiceWithPrice {
  const prices = service.service_prices ?? [];

  const exact = region ? prices.find((p) => p.region_id === region.id) : undefined;
  const fallback = prices.find((p) => p.region?.is_default);

  const { service_prices: _prices, ...rest } = service;

  return { ...rest, price: exact ?? fallback ?? null };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/**
 * Format an amount for display.
 *
 * Indian rupees use the `en-IN` locale so grouping follows the lakh/crore
 * convention, ₹1,20,000 rather than ₹120,000, which reads as wrong to an
 * Indian customer.
 */
export function formatPrice(amount: number, currency: string): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // Whole numbers stay whole; 1499.50 keeps its paise.
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

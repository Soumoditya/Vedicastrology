/**
 * Database types.
 *
 * Hand-written rather than generated, so the shapes the application actually
 * uses stay readable and documented. They mirror
 * `supabase/migrations/20260729000100_core_schema.sql`, if you change the
 * schema, change this too.
 */

export type UserRole = 'user' | 'admin';
export type PostStatus = 'draft' | 'scheduled' | 'published';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'scheduled'
  | 'completed'
  | 'closed';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BirthProfile {
  id: string;
  user_id: string;
  label: string;
  person_name: string | null;
  birth_date: string;
  birth_time: string | null;
  time_unknown: boolean;
  timezone: string;
  place_name: string;
  latitude: number;
  longitude: number;
  gender: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  currency: string;
  symbol: string;
  /** ISO 3166-1 alpha-2 codes belonging to this region. */
  country_codes: string[];
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  duration_minutes: number | null;
  deliverables: string[];
  cover_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePrice {
  id: string;
  service_id: string;
  region_id: string;
  amount: number;
  compare_at: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown | null;
  content_html: string | null;
  cover_url: string | null;
  category_id: string | null;
  status: PostStatus;
  published_at: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  user_id: string | null;
  author_name: string;
  author_location: string | null;
  rating: number;
  body: string;
  service_id: string | null;
  status: ModerationStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  user_id: string | null;
  service_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  birth_details: unknown | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: boolean;
  instagram_handle: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  announcement_text: string | null;
  announcement_active: boolean;
  updated_at: string;
}

/** A service together with the price applicable to the current visitor. */
export interface ServiceWithPrice extends Service {
  price: (ServicePrice & { region: Region }) | null;
}

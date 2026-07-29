'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { createClient, isAdmin } from '@/lib/supabase/server';
import { notificationAddress, sendMail } from '@/lib/email/send';
import { REGION_COOKIE } from '@/lib/pricing/region';
import type { EnquiryStatus } from '@/lib/supabase/types';

export interface EnquiryState {
  error?: string;
  message?: string;
}

const enquirySchema = z.object({
  name: z.string().min(2, 'Please tell me your name.'),
  email: z.string().email('That email address does not look right.'),
  phone: z.string().optional(),
  message: z.string().min(10, 'A sentence or two about what you are looking for helps.'),
  service_id: z.string().uuid().optional().or(z.literal('')),
  // Birth details are optional. Asking for them up front saves a round trip,
  // but insisting on them loses people who are only enquiring.
  birth_date: z.string().optional(),
  birth_time: z.string().optional(),
  birth_place: z.string().optional(),
});

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    message: formData.get('message'),
    service_id: formData.get('service_id') || '',
    birth_date: formData.get('birth_date') || undefined,
    birth_time: formData.get('birth_time') || undefined,
    birth_place: formData.get('birth_place') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;
  const supabase = await createClient();

  // Attach the account if there is one, so the enquiry shows in their history.
  // Anonymous enquiries are equally valid and must keep working.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const birthDetails =
    data.birth_date || data.birth_time || data.birth_place
      ? {
          date: data.birth_date ?? null,
          time: data.birth_time ?? null,
          place: data.birth_place ?? null,
        }
      : null;

  const { error } = await supabase.from('enquiries').insert({
    user_id: user?.id ?? null,
    service_id: data.service_id || null,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    message: data.message,
    birth_details: birthDetails,
    // The policy requires this, and it is set explicitly rather than relying on
    // the column default so the intent is visible at the call site.
    status: 'new',
  });

  if (error) {
    return {
      error: 'Something went wrong sending that. Please try again in a moment.',
    };
  }

  // Notify, but never let a mail failure look like a failed enquiry: the
  // enquiry is already safely stored by this point.
  const { data: settings } = await supabase
    .from('site_settings')
    .select('contact_email')
    .maybeSingle();

  const to = notificationAddress(settings?.contact_email);
  if (to) {
    await sendMail({
      to,
      replyTo: data.email,
      subject: `New enquiry from ${data.name}`,
      text: [
        `${data.name} <${data.email}>`,
        data.phone ? `Phone: ${data.phone}` : null,
        birthDetails
          ? `Birth: ${[birthDetails.date, birthDetails.time, birthDetails.place].filter(Boolean).join(', ')}`
          : null,
        '',
        data.message,
      ]
        .filter((line) => line !== null)
        .join('\n'),
    });
  }

  revalidatePath('/admin/enquiries');

  return {
    message:
      'Thank you, that has reached me. I reply to everything personally, usually within a day or two.',
  };
}

/** Move an enquiry along its pipeline. Admin only. */
export async function setEnquiryStatus(formData: FormData): Promise<void> {
  if (!(await isAdmin())) throw new Error('Not authorised.');

  const id = formData.get('id') as string;
  const status = formData.get('status') as EnquiryStatus;

  const supabase = await createClient();
  await supabase.from('enquiries').update({ status }).eq('id', id);

  revalidatePath('/admin/enquiries');
}

/**
 * Record the visitor's chosen currency.
 *
 * Stored as a cookie rather than in the URL so the choice survives navigation
 * and is available to every server component through `resolveRegion()`.
 */
export async function setRegion(formData: FormData): Promise<void> {
  const code = formData.get('region') as string;
  if (!code) return;

  const cookieStore = await cookies();
  cookieStore.set(REGION_COOKIE, code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
}

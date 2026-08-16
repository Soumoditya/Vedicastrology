import 'server-only';

/**
 * Transactional email.
 *
 * Sending is deliberately optional. If RESEND_API_KEY is not configured the
 * message is logged and the caller carries on, because an enquiry that reaches
 * the database but fails to email is a notification problem, not a lost lead.
 * Losing the enquiry itself because a mail provider was down would be far
 * worse.
 */

export interface Mail {
  to: string;
  subject: string;
  /** Plain text. Deliverability is better and there is nothing here that needs HTML. */
  text: string;
  replyTo?: string;
}

const ENDPOINT = 'https://api.resend.com/emails';

export async function sendMail(mail: Mail): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.info('[email] Not configured, would have sent:', {
      to: mail.to,
      subject: mail.subject,
    });
    return { sent: false, reason: 'not_configured' };
  }

  // Resend's shared sandbox sender works without a verified domain, which is
  // enough until a domain is set up.
  const from = process.env.EMAIL_FROM ?? 'Vedic Astrologey <onboarding@resend.dev>';

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[email] Send failed', response.status, detail);
      return { sent: false, reason: `http_${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error('[email] Send threw', error);
    return { sent: false, reason: 'exception' };
  }
}

/** Where enquiry notifications go. Falls back to the site settings address. */
export function notificationAddress(fallback?: string | null): string | null {
  return process.env.ENQUIRY_NOTIFY_EMAIL ?? fallback ?? null;
}

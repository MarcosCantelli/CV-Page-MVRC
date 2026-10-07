import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  MAIL_DRIVER,
  RESEND_API_KEY,
} from 'astro:env/server';
import { LogMailer } from './log';
import { ResendMailer } from './resend';
import type { Mailer } from './types';

export type { MailMessage, Mailer } from './types';

let mailer: Mailer | undefined;

/** Picks the provider from MAIL_DRIVER. Add new drivers here (e.g. "smtp"). */
export function getMailer(): Mailer {
  if (mailer) return mailer;
  if (MAIL_DRIVER === 'log') {
    mailer = new LogMailer();
  } else {
    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
      throw new Error(
        'Mail is not configured: set RESEND_API_KEY, CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL (or MAIL_DRIVER=log).',
      );
    }
    mailer = new ResendMailer(RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL);
  }
  return mailer;
}

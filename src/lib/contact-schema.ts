// Shared by the browser (form) and the server (/api/contact).
// zod/mini keeps the client bundle small.
import * as z from 'zod/mini';

// Single-line fields end up in the e-mail subject: reject control characters (CR/LF etc.).
const singleLine = z.regex(/^[^\p{Cc}]*$/u);

export const contactSchema = z.object({
  name: z.string().check(z.trim(), z.minLength(2), z.maxLength(100), singleLine),
  email: z.string().check(z.trim(), z.maxLength(254), z.email()),
  company: z.optional(z.string().check(z.trim(), z.maxLength(120), singleLine)),
  message: z.string().check(z.trim(), z.minLength(10), z.maxLength(5000)),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Error codes returned by the API; the UI maps each to a translated message. */
export type ContactErrorCode = ContactField | 'captcha' | 'rate_limited' | 'server';

/** Returns the list of invalid fields (empty when valid). */
export function invalidFields(input: unknown): ContactField[] {
  const result = z.safeParse(contactSchema, input);
  if (result.success) return [];
  const fields = result.error.issues.map((issue) => issue.path[0] as ContactField);
  return [...new Set(fields)];
}

/** Name of the hidden honeypot field. Humans never fill it. */
export const HONEYPOT_FIELD = 'website';

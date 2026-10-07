export interface MailMessage {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

/** Sending layer. Implement this interface to switch providers (e.g. SMTP). */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

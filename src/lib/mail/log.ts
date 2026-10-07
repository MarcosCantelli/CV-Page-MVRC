import type { MailMessage, Mailer } from './types';

/** Development mailer: prints the message instead of sending it. */
export class LogMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.info('[mail:log] would send message\n', {
      subject: message.subject,
      replyTo: message.replyTo,
      text: message.text,
    });
  }
}

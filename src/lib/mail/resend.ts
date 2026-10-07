import { Resend } from 'resend';
import type { MailMessage, Mailer } from './types';

export class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
    private readonly to: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: [this.to],
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
  }
}

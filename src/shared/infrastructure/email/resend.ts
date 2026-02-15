import { Resend } from 'resend';
import * as dotenv from 'dotenv';

export class ResendConfigAdapter {
  constructor(private readonly API_KEY: string) {}

  getInstance() {
    return new Resend(this.API_KEY);
  }

  async getTemplate(templateId: string) {
    const template = await this.getInstance().templates.get(templateId);
    return template;
  }

  async sendEmail(
    email: string,
    subject: string,
    templateId: string,
    data: Record<string, string | number>
  ) {
    const template = await this.getTemplate(templateId);
    if (!template.data) {
      throw new Error('Template not found');
    }

    return this.getInstance().emails.send({
      subject,
      from: process.env.RESEND_FROM_EMAIL ?? 'no-reply@subscription-tracker.com',
      to: email,
      template: { id: template.data.id, variables: data },
    });
  }
}

dotenv.config();
export const resendAdapter = new ResendConfigAdapter(process.env.RESEND_API_KEY ?? '');

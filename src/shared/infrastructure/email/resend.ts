import { Resend } from 'resend';
import * as dotenv from 'dotenv';

export class ResendConfigAdapter {
  constructor(private readonly API_KEY: string) {}

  getInstance() {
    return new Resend(this.API_KEY);
  }

  async sendEmail(
    email: string,
    subject: string,
    templateId: string,
    data: Record<string, string | number>
  ) {
    return this.getInstance().emails.send({
      subject,
      from: process.env.RESEND_TEST_EMAIL,
      to: email,
      template: { id: templateId, variables: data },
    });
  }
}

dotenv.config();
export const resendAdapter = new ResendConfigAdapter(process.env.RESEND_API_KEY ?? '');

import { emailTemplates } from '../constants/emails.templates';

export abstract class MailerPort {
  abstract sendEmail(dto: {
    recipients: string[];
    template: keyof typeof emailTemplates;
    data: any;
  }): Promise<void>;
}

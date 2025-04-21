import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import { emailTemplates } from './templates/emails.templates';

/**
 * Service responsible for handling email operations
 * @class EmailsService
 */
@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  private readonly transporter: nodemailer.Transporter;

  /**
   * Creates an instance of EmailsService
   * @param {ConfigService} configService - The configuration service for accessing environment variables
   */
  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  /**
   * Creates and configures a nodemailer transporter instance
   * @private
   * @returns {nodemailer.Transporter} Configured nodemailer transporter
   */
  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      auth: {
        pass: this.configService.getOrThrow<string>('EMAIL_PASSWORD'),
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
      },
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: this.configService.getOrThrow<number>('EMAIL_PORT'),
      secure: true,
    });
  }

  /**
   * Creates email options for sending
   * @private
   * @param {string[]} recipients - Array of recipient email addresses
   * @param {string} subject - Email subject
   * @param {string} html - HTML content of the email
   * @returns {nodemailer.SendMailOptions} Configured email options
   */
  private createEmailOptions(
    recipients: string[],
    subject: string,
    html: string,
  ): nodemailer.SendMailOptions {
    return {
      from: this.configService.getOrThrow<string>('EMAIL_USER'),
      html,
      subject,
      to: recipients.join(', '),
    };
  }

  /**
   * Sends an email to the specified recipients
   * @param {CreateEmailDto} dto - Data transfer object containing email details
   * @throws Error if email sending fails
   * @returns Promise<void>
   */
  async sendEmail(dto: {
    recipients: string[];
    template: keyof typeof emailTemplates;
    data: any;
  }): Promise<void> {
    const template = emailTemplates[dto.template];

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.getOrThrow<string>('EMAIL_USER'),
      html: template.html(dto.data),
      subject: template.subject,
      to: dto.recipients.join(', '),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${dto.recipients.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}

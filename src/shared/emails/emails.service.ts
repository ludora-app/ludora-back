import * as nodemailer from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { emailTemplates } from './templates/emails.templates';

/**
 * Service responsible for handling email operations
 * @class EmailsService
 */
@Injectable()
export class EmailsService {
  private readonly transporter: nodemailer.Transporter;

  /**
   * Creates an instance of EmailsService
   * @param {ConfigService} configService - The configuration service for accessing environment variables
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailsService.name);
    this.transporter = this.createTransporter();
  }

  private readonly adminEmail: string = this.configService.getOrThrow<string>('LUDORA_ADMIN_EMAIL');

  /**
   * Creates and configures a nodemailer transporter instance
   * @private
   * @returns {nodemailer.Transporter} Configured nodemailer transporter
   */
  private createTransporter(): nodemailer.Transporter {
    const emailPort = this.configService.getOrThrow<number>('EMAIL_PORT');
    return nodemailer.createTransport({
      auth: {
        pass: this.configService.getOrThrow<string>('EMAIL_PASSWORD'),
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
      },
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: emailPort,
      secure: emailPort === 465,
      tls: {
        rejectUnauthorized: false,
      },
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
      this.logger.debug(`Email sent successfully to ${dto.recipients.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }

  async sendNewFieldAdministrationRequestEmail(fieldUid: string) {
    await this.sendEmail({
      data: {
        link: `${this.configService.getOrThrow<string>('BASE_URL')}/fields/admin/${fieldUid}`,
      },
      recipients: [this.adminEmail],
      template: 'newFieldAdministrationRequest',
    });
  }

  async testEmail() {
    await this.sendEmail({
      data: {
        name: 'John Doe',
      },
      recipients: ['ganafall9498@gmail.com'],
      template: 'welcomeEmail',
    });
    await this.sendEmail({
      data: {
        link: 'https://ludora.app/verify-email?token=123456',
      },
      recipients: ['ganafall9498@gmail.com'],
      template: 'verificationLink',
    });
    await this.sendEmail({
      data: {
        name: 'John Doe',
      },
      recipients: ['ganafall9498@gmail.com'],
      template: 'emailVerified',
    });
    await this.sendEmail({
      data: {
        name: 'John Doe',
      },
      recipients: ['ganafall9498@gmail.com'],
      template: 'passwordReset',
    });
    await this.sendEmail({
      data: {
        name: 'John Doe',
      },
      recipients: ['ganafall9498@gmail.com'],
      template: 'passwordResetRequest',
    });
  }
}

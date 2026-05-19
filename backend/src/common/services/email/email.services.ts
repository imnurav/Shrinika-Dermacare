import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { SendEmailOptions } from './email.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;

  constructor(private readonly configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async sendEmail(options: SendEmailOptions) {
    try {
      const command = new SendEmailCommand({
        Source: this.configService.get<string>('SES_FROM_EMAIL'),
        Destination: { ToAddresses: [options.to] },
        Message: {
          Subject: { Data: options.subject },
          Body: { Html: { Data: options.html } },
        },
      });
      const response = await this.sesClient.send(command);
      this.logger.log(`Email sent to ${options.to}`);
      return response;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async sendForgotPasswordEmail(email: string, resetToken: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    const { forgotPasswordTemplate } = await import('./templates/forgot-password.template');
    return this.sendEmail({
      to: email,
      subject: 'Reset Password',
      html: forgotPasswordTemplate(resetLink),
    });
  }
}

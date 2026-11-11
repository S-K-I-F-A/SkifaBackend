import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.transporter = this.createTransporter();
  }

  async sendConfirmation(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return this.send(
      email,
      'Confirm your Skifa email',
      `Confirm your email: ${frontendUrl}/confirm-email?token=${encodeURIComponent(token)}`,
    );
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return this.send(
      email,
      'Reset your Skifa password',
      `Reset your password: ${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`,
    );
  }

  async send(email: string, subject: string, text: string): Promise<boolean> {
    const mode = this.config.get<string>('EMAIL_MODE', 'disabled');
    if (mode === 'log') {
      this.logger.log(
        `[development email] to=${email} subject=${subject} ${text}`,
      );
      return true;
    }
    if (mode !== 'smtp' || !this.transporter) return false;

    await this.transporter.sendMail({
      from: this.config.get<string>(
        'SMTP_FROM',
        'Skifa <no-reply@skifa.local>',
      ),
      to: email,
      subject,
      text,
    });
    return true;
  }

  private createTransporter(): Transporter | null {
    if (this.config.get<string>('EMAIL_MODE', 'disabled') !== 'smtp')
      return null;
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) return null;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    return nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<boolean>('SMTP_SECURE', false),
      auth: user && pass ? { user, pass } : undefined,
    });
  }
}

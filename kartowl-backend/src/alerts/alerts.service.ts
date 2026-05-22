import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlert } from './price-alert.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly emailEnabled = Boolean(
    process.env.EMAIL_USER && process.env.EMAIL_PASS,
  );

  constructor(
    @InjectRepository(PriceAlert)
    private readonly alertRepository: Repository<PriceAlert>,
  ) {}

  private getMailTransports() {
    const baseAuth = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };

    const commonOptions = {
      auth: baseAuth,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 45000,
      family: 4,
      tls: {
        rejectUnauthorized: false,
      },
    };

    const configuredTransport = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
      ...commonOptions,
    };

    const gmailSecureTransport = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      requireTLS: false,
      ...commonOptions,
    };

    const gmailTlsTransport = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      ...commonOptions,
    };

    const transports = [
      configuredTransport,
      gmailSecureTransport,
      gmailTlsTransport,
    ];

    return transports.filter(
      (transport, index, allTransports) =>
        allTransports.findIndex(
          (candidate) =>
            candidate.host === transport.host &&
            candidate.port === transport.port &&
            candidate.secure === transport.secure,
        ) === index,
    );
  }

  private async sendMail(mailOptions: nodemailer.SendMailOptions) {
    if (!this.emailEnabled) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not configured');
    }

    const errors: string[] = [];

    for (const transportOptions of this.getMailTransports()) {
      try {
        this.logger.log(
          `Sending email via ${transportOptions.host}:${transportOptions.port}`,
        );
        const transporter = nodemailer.createTransport(transportOptions);
        return await transporter.sendMail(mailOptions);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(
          `${transportOptions.host}:${transportOptions.port} - ${message}`,
        );
        this.logger.warn(
          `Email transport failed (${transportOptions.host}:${transportOptions.port}): ${message}`,
        );
      }
    }

    throw new Error(`All email transports failed: ${errors.join(' | ')}`);
  }

  @Cron('0 */6 * * *')
  async checkPriceAlerts() {
    this.logger.log('Checking price alerts...');

    const activeAlerts = await this.alertRepository.find({
      where: { status: 'active' },
    });

    if (activeAlerts.length === 0) {
      this.logger.log('No active alerts found');
      return;
    }

    this.logger.log(`Found ${activeAlerts.length} active alerts`);

    for (const alert of activeAlerts) {
      try {
        const currentPrice = await this.scrapeCurrentPrice(alert.productUrl);

        if (currentPrice && currentPrice <= alert.targetPrice) {
          await this.sendPriceDropEmail(alert, currentPrice);
          await this.alertRepository.update(alert.id, {
            status: 'triggered',
            currentPrice,
          });
          this.logger.log(`Alert triggered for ${alert.productTitle}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error checking alert ${alert.id}: ${message}`);
      }
    }
  }

  private async scrapeCurrentPrice(productUrl: string): Promise<number | null> {
    try {
      if (productUrl.includes('priceoye.pk')) {
        const slug = productUrl.split('priceoye.pk/')[1];
        const response = await fetch(`https://priceoye.pk/api/product/${slug}`);
        if (response.ok) {
          const data = await response.json();
          return data?.price || null;
        }
      }

      if (productUrl.includes('telemart.pk')) {
        const slug = productUrl.split('telemart.pk/')[1];
        const response = await fetch(
          'https://7z6unqyqer-3.algolianet.com/1/indexes/products/query?x-algolia-api-key=9b4c33f99e845fe1363fd4c6ceb0f467&x-algolia-application-id=7Z6UNQYQER',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: slug, hitsPerPage: 1 }),
          },
        );
        if (response.ok) {
          const data = await response.json();
          const hit = data?.hits?.[0];
          return hit?.discounted_price || hit?.sale_price || null;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async createAlert(
    email: string,
    productUrl: string,
    targetPrice: number,
    productTitle: string,
  ) {
    const alert = await this.alertRepository.save({
      email,
      productUrl,
      productTitle,
      targetPrice,
      status: 'active',
    });

    try {
      await this.sendConfirmationEmail(email, productUrl, targetPrice, productTitle);
      return { alert, emailSent: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Alert saved but confirmation email failed: ${message}`);
      return { alert, emailSent: false, emailError: message };
    }
  }

  async sendConfirmation(
    email: string,
    productUrl: string,
    targetPrice: number,
    productTitle: string,
  ) {
    return this.createAlert(email, productUrl, targetPrice, productTitle);
  }

  private async sendConfirmationEmail(
    email: string,
    productUrl: string,
    targetPrice: number,
    productTitle: string,
  ) {
    if (!this.emailEnabled) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not configured');
    }

    await this.sendMail({
      from: `"KartOwl" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Price Alert Set Successfully!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">KartOwl Price Alert</h2>
          <p>Your price alert has been set successfully!</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${productTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Target Price</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${targetPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product Link</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;"><a href="${productUrl}">View Product</a></td>
            </tr>
          </table>
          <p style="color: #666; margin-top: 20px;">We will notify you every 6 hours when the price drops to your target.</p>
        </div>
      `,
    });
  }

  private async sendPriceDropEmail(alert: PriceAlert, currentPrice: number) {
    if (!this.emailEnabled) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not configured');
    }

    await this.sendMail({
      from: `"KartOwl" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: alert.email,
      subject: 'Price Drop Alert! Your target price has been reached!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Price Drop Alert!</h2>
          <p>Great news! The price has dropped to your target.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${alert.productTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Current Price</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; color: #10B981;"><strong>Rs. ${currentPrice.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Your Target</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${alert.targetPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Buy Now</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;"><a href="${alert.productUrl}" style="background: #4F46E5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">View Product</a></td>
            </tr>
          </table>
        </div>
      `,
    });
  }
}

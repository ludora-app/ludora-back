import { BadRequestException, Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('/stripe')
  async handleStripeWebhook(@Req() req: RawBodyRequest<FastifyRequest>) {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody; // The raw buffer populated by Fastify rawBody: true

    if (!signature || !rawBody) {
      throw new BadRequestException('Missing signature or raw body');
    }

    try {
      const event = await this.webhooksService.verifyStripeSignature(rawBody, signature as string);
      return this.webhooksService.processStripeEvent(event);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}

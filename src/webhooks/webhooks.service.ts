import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-08-27.basil' as any,
      typescript: true,
    });
  }

  async verifyStripeSignature(rawBody: Buffer, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async processStripeEvent(event: Stripe.Event) {
    // 1. Idempotency Check
    const existingEvent = await this.prisma.stripeEvents.findUnique({
      where: { id: event.id },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      this.logger.debug(`Event ${event.id} already processed. Ignoring.`);
      return { received: true };
    }

    // Record the event as PENDING
    await this.prisma.stripeEvents.upsert({
      where: { id: event.id },
      update: { type: event.type, status: 'PENDING' },
      create: { id: event.id, type: event.type, status: 'PENDING' },
    });

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        default:
          this.logger.debug(`Unhandled event type ${event.type}`);
      }

      // Mark as PROCESSED
      await this.prisma.stripeEvents.update({
        where: { id: event.id },
        data: { status: 'PROCESSED' },
      });
    } catch (error) {
      // Mark as FAILED
      await this.prisma.stripeEvents.update({
        where: { id: event.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment Intent succeeded: ${paymentIntent.id}`);

    // Update or Create Payments record in database
    await this.prisma.payments.upsert({
      where: { stripePaymentId: paymentIntent.id },
      update: { status: 'SUCCESS' },
      create: {
        stripePaymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'SUCCESS',
        sessionUid: paymentIntent.metadata?.sessionUid || 'unknown',
        userUid: paymentIntent.metadata?.userUid || 'unknown',
        applicationFee: 0,
      },
    });

    // TODO: Mettre à jour la réservation (Session/Booking) en CONFIRMED
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment Intent failed: ${paymentIntent.id}`);

    await this.prisma.payments.update({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });

    // TODO: Libérer le créneau, annuler la réservation
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);

    if (charge.payment_intent) {
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent.id;

      const payment = await this.prisma.payments.findUnique({
        where: { stripePaymentId: paymentIntentId },
      });

      if (payment) {
        await this.prisma.payments.update({
          where: { stripePaymentId: paymentIntentId },
          data: { status: 'REFUNDED' }, // or PARTIALLY_REFUNDED depending on amount
        });

        if (charge.refunds?.data.length) {
          for (const stripeRefund of charge.refunds.data) {
            await this.prisma.refunds.upsert({
              where: { stripeRefundId: stripeRefund.id },
              update: { status: stripeRefund.status },
              create: {
                stripeRefundId: stripeRefund.id,
                amount: stripeRefund.amount,
                reason: stripeRefund.reason || null,
                status: stripeRefund.status,
                paymentUid: payment.uid,
              },
            });
          }
        }
      }
    }
  }

  private async handleChargeDisputeCreated(dispute: Stripe.Dispute) {
    this.logger.log(`Dispute created: ${dispute.id}`);
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;
    if (paymentIntentId) {
      await this.prisma.payments.update({
        where: { stripePaymentId: paymentIntentId },
        data: { status: 'DISPUTED' },
      });
    }
  }
}

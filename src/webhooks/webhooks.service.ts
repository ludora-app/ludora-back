import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeEventStatus } from 'generated/prisma/enums';
import { Stripe } from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private _stripe: Stripe | null = null;
  private readonly logger = new Logger(WebhooksService.name);

  private get stripe(): Stripe {
    if (!this._stripe) {
      this._stripe = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
        apiVersion: '2025-08-27.basil' as any,
        typescript: true,
      });
    }
    return this._stripe;
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async verifyStripeSignature(rawBody: Buffer, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'); // runtime only — safe
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
      update: { type: event.type, status: StripeEventStatus.PROCESSING },
      create: { id: event.id, type: event.type, status: StripeEventStatus.PROCESSING },
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
        case 'account.updated':
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
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

    const sessionUid = paymentIntent.metadata?.sessionUid;
    const userUid = paymentIntent.metadata?.userUid;
    const partnerUid = paymentIntent.metadata?.partnerUid;
    const commissionRateSnapshot = paymentIntent.metadata?.commissionRateSnapshot
      ? Number(paymentIntent.metadata.commissionRateSnapshot)
      : 0.15;
    const idempotencyKey = paymentIntent.id;

    if (!sessionUid || !userUid || !partnerUid) {
      this.logger.warn(
        `Missing metadata for Payment Intent ${paymentIntent.id}. Cannot create Payment record.`,
      );
      return;
    }

    // Update or Create Payments record in database
    await this.prisma.payments.upsert({
      where: { stripePaymentIntentId: paymentIntent.id },
      update: { status: 'SUCCESS' },
      create: {
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'SUCCESS',
        sessionUid,
        userUid,
        partnerUid,
        commissionRateSnapshot,
        idempotencyKey,
        amountPlatform: 0,
      },
    });

    // TODO: Mettre à jour la réservation (Session/Booking) en CONFIRMED
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment Intent failed: ${paymentIntent.id}`);

    await this.prisma.payments.update({
      where: { stripePaymentIntentId: paymentIntent.id },
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
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (payment) {
        await this.prisma.payments.update({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: 'REFUNDED' }, // or PARTIALLY_REFUNDED depending on amount
        });

        if (charge.refunds?.data.length) {
          for (const stripeRefund of charge.refunds.data) {
            const refundStatus = (stripeRefund.status?.toUpperCase() || 'PENDING') as any;
            let refundReason: any = 'OTHER';
            if (stripeRefund.reason === 'fraudulent') refundReason = 'FRAUD';
            else if (stripeRefund.reason === 'requested_by_customer')
              refundReason = 'CUSTOMER_CANCELLED';
            else if (!stripeRefund.reason) refundReason = null;

            await this.prisma.refunds.upsert({
              where: { stripeRefundId: stripeRefund.id },
              update: { status: refundStatus },
              create: {
                stripeRefundId: stripeRefund.id,
                amount: stripeRefund.amount,
                reason: refundReason,
                status: refundStatus,
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
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: 'DISPUTED' },
      });
    }
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    this.logger.log(`Account updated: ${account.id}`);

    // Update the PartnerBillingConfig status based on charges_enabled and payouts_enabled
    // Handle specific reasons to distinguish RESTRICTED and REJECTED status.
    let status: 'PENDING' | 'ACTIVE' | 'RESTRICTED' | 'REJECTED' = 'PENDING';

    if (account.charges_enabled && account.payouts_enabled) {
      status = 'ACTIVE';
    } else if (account.requirements?.disabled_reason) {
      if (account.requirements.disabled_reason.startsWith('rejected.')) {
        status = 'REJECTED';
      } else {
        // e.g., requirements.past_due, requirements.pending_verification
        status = 'RESTRICTED';
      }
    } else {
      // If neither enabled nor disabled_reason is set, mostly means onboarding is incomplete
      // Consider "Past due" as normal (PENDING) while onboarding is not complete
      status = 'PENDING';
    }

    try {
      await this.prisma.partnerBillingConfig.update({
        where: { stripeAccountId: account.id },
        data: { stripeAccountStatus: status as any }, // Assert any for typescript until prisma client catches up
      });
      this.logger.log(`Stripe account ${account.id} status updated to ${status}`);
    } catch (err) {
      this.logger.warn(
        `Could not update partner settings for account ${account.id}: ${err.message}`,
      );
    }
  }
}

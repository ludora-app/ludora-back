import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import Stripe from 'stripe';
import { BankDetailsDto, UpdateBankDetailsDto } from './dto/input/bank-details.dto';
import { ConfirmPaymentIntentDto } from './dto/input/confirm-payment.dto';
import { PaymentIntentDto } from './dto/input/payment-intent.dto';
import { PaymentIntentTestDto } from './dto/input/payment-intent-test.dto';
import { BankAccountListResponseDataDto } from './dto/output/bankAccount-list-response.dto';

@Injectable()
export class PaymentService {
  private _stripe: Stripe | null = null;

  private get stripe(): Stripe {
    if (!this._stripe) {
      this._stripe = new Stripe(this.configService.getOrThrow('STRIPE_SECRET_KEY'), {
        apiVersion: '2025-08-27.basil',
        typescript: true,
      });
    }
    return this._stripe;
  }

  constructor(
    readonly _prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentService.name);
  }

  private async getPartnerStripeAccountId(partnerUid: string): Promise<string> {
    const partner = await this._prismaService.partners.findUnique({
      where: { uid: partnerUid },
      include: { partnerBillingConfigs: true },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    const stripeAccountId = partner.partnerBillingConfigs?.stripeAccountId;
    if (!stripeAccountId) {
      throw new NotFoundException('Stripe account not found');
    }

    return stripeAccountId;
  }

  async createStripeConnectAccount(partnerUid: string): Promise<void> {
    try {
      const partner = await this._prismaService.partners.findUnique({
        where: { uid: partnerUid },
        include: { partnerBillingConfigs: true },
      });

      if (!partner) {
        throw new NotFoundException('Partner not found');
      }

      if (partner.partnerBillingConfigs?.stripeAccountId) {
        throw new BadRequestException('Stripe account already exists');
      }

      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        business_type: 'company',
        company: {
          name: partner.name,
          phone: partner.phone,
          address: {
            line1: partner.address,
            city: partner.city,
            postal_code: partner.zipCode,
            country: partner.country,
          },
        },
        email: partner.email,
      });

      await this._prismaService.partnerBillingConfig.upsert({
        where: { partnerUid: partner.uid },
        update: { stripeAccountId: stripeAccount.id },
        create: { partnerUid: partner.uid, stripeAccountId: stripeAccount.id },
      });

      this.logger.info(`Stripe account created for partner ${partnerUid}: ${stripeAccount.id}`);
    } catch (error) {
      this.logger.error(
        `Error creating Stripe account for partner ${partnerUid}: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async generateStripeAccountLink(partnerUid: string): Promise<{ url: string }> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      // The refresh_url and return_url should point to the frontend (e.g. partner dashboard)
      // They can be configured in env, falling back to a dummy one if not set
      const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'https://ludora.fr';

      const accountLink = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/partner/onboarding/refresh`,
        return_url: `${baseUrl}/partner/dashboard?onboarding=success`,
        type: 'account_onboarding',
      });

      return { url: accountLink.url };
    } catch (error) {
      this.logger.error(`Error generating Stripe account link: ${error.message}`);
      throw new BadRequestException('Could not generate onboarding link.');
    }
  }

  async getStripeConnectAccount(partnerUid: string): Promise<Stripe.Account> {
    const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);
    const stripeAccount = await this.stripe.accounts.retrieve(stripeAccountId);
    return stripeAccount;
  }

  async deleteStripeConnectAccount(partnerUid: string): Promise<void> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      const deletedAccount = await this.stripe.accounts.del(stripeAccountId);

      if (deletedAccount) {
        await this._prismaService.partnerBillingConfig.update({
          where: { partnerUid },
          data: { stripeAccountId: null },
        });
      } else {
        throw new BadRequestException('Error deleting account');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * The function `createPaymentIntent` in TypeScript creates a Stripe PaymentIntent with specified
   * details and transfers the payment to a connected account.
   * @param {PaymentIntentDto} paymentIntent - The `paymentIntent` parameter in the `createPaymentIntent`
   * function is of type `PaymentIntentDto`, which likely contains the following properties:
   * @returns The `createPaymentIntent` function returns a Promise that resolves to a Stripe
   * PaymentIntent object.
   */
  async createPaymentIntent(paymentIntentDto: PaymentIntentDto): Promise<Stripe.PaymentIntent> {
    const { amount, currency, paymentMethodId, sessionUid, userUid } = paymentIntentDto;

    const session = await this._prismaService.sessions.findUnique({
      where: { uid: sessionUid },
      include: { field: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const partnerUid = session.field.partnerUid;
    if (!partnerUid) {
      throw new BadRequestException('Session field does not have an associated partner');
    }

    const partnerBillingConfig = await this._prismaService.partnerBillingConfig.findUnique({
      where: { partnerUid },
    });

    const connectedAccountId = await this.getPartnerStripeAccountId(partnerUid);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        // Add to support all payment types
        automatic_payment_methods: {
          allow_redirects: 'never', // Important for mobile
          enabled: true,
        },
        // The mobile client will confirm after presenting the wallet
        confirm: false,
        // Configuration for Stripe Connect
        transfer_data: {
          destination: connectedAccountId,
        },
        // Useful metadata for tracking
        metadata: {
          platform: 'mobile',
          sessionUid,
          userUid,
          partnerUid,
          commissionRateSnapshot: String(partnerBillingConfig?.commissionRate || 0.15),
        },
      });

      return paymentIntent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Confirm an existing PaymentIntent (used by mobile wallets)
   * @param confirmPaymentIntent - DTO containing the PaymentIntent ID and optional PaymentMethod ID
   */
  async confirmPaymentIntent(
    confirmPaymentIntent: ConfirmPaymentIntentDto,
  ): Promise<Stripe.PaymentIntent> {
    const { paymentIntentId, paymentMethodId } = confirmPaymentIntent;
    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};

      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmParams,
      );

      this.logger.debug(`PaymentIntent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming PaymentIntent: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async addBankAccount(partnerUid: string, bankDetails: BankDetailsDto): Promise<void> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      const userBankAccount = await this.stripe.accounts.listExternalAccounts(stripeAccountId, {
        object: 'bank_account',
      });
      if (userBankAccount.data.length >= 4) {
        throw new BadRequestException('You can only have 4 bank accounts');
      }
      await this.stripe.accounts.createExternalAccount(stripeAccountId, {
        external_account: {
          account_holder_name: bankDetails.holderName,
          account_holder_type: 'company',
          account_number: bankDetails.accountNumber,
          country: 'FR',
          currency: 'eur',
          object: 'bank_account',
          routing_number: bankDetails.routingNumber,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBankAccountsList(
    partnerUid: string,
  ): Promise<PaginatedDataDto<BankAccountListResponseDataDto>> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      const bankAccounts = await this.stripe.accounts.listExternalAccounts(stripeAccountId, {
        object: 'bank_account',
      });
      const filteredAccounts = bankAccounts.data.map((account: Stripe.BankAccount) => ({
        bank_name: account.bank_name,
        country: account.country,
        currency: account.currency,
        default_for_currency: account.default_for_currency,
        future_requirements: account.future_requirements,
        holder_name: account.account_holder_name,
        id: account.id,
        last4: account.last4,
        requirements: account.requirements,
        routing_number: account.routing_number,
        status: account.status,
      }));

      return {
        items: filteredAccounts,
        nextCursor: null,
        totalCount: bankAccounts.data.length,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async getBankAccount(partnerUid: string, bankAccountId: string): Promise<Stripe.ExternalAccount> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      const bankAccount = await this.stripe.accounts.retrieveExternalAccount(
        stripeAccountId,
        bankAccountId,
      );
      return bankAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateDefaultBankAccount(
    partnerUid: string,
    bankAccountId: string,
    bankDetails: UpdateBankDetailsDto,
  ): Promise<void> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      await this.stripe.accounts.updateExternalAccount(stripeAccountId, bankAccountId, {
        default_for_currency: bankDetails.defaultForCurrency,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteBankAccount(partnerUid: string, bankAccountId: string): Promise<void> {
    try {
      const stripeAccountId = await this.getPartnerStripeAccountId(partnerUid);

      await this.stripe.accounts.deleteExternalAccount(stripeAccountId, bankAccountId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ===== TESTING METHODS (DEVELOPMENT ONLY) =====

  /**
   * Retrieve a test PaymentMethod predefined by Stripe
   * Use the official test PaymentMethods instead of creating with raw card data
   * Documentation: https://docs.stripe.com/testing#cards
   */
  async createPaymentMethodForTesting(): Promise<Stripe.PaymentMethod> {
    try {
      // Use a test PaymentMethod predefined by Stripe
      // pm_card_visa is a test PaymentMethod that simulates a valid Visa card
      const testPaymentMethodId = 'pm_card_visa';

      const paymentMethod = await this.stripe.paymentMethods.retrieve(testPaymentMethodId);

      this.logger.debug(`Test PaymentMethod retrieved: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error retrieving test PaymentMethod: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Create a complete PaymentIntent with an automatically generated PaymentMethod
   * Useful for tests without frontend
   */
  async createPaymentIntentWithTestCard(
    paymentIntent: PaymentIntentTestDto,
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Create a test PaymentMethod
      const testPaymentMethod = await this.createPaymentMethodForTesting();

      // Create the PaymentIntent with the test PaymentMethod
      const fullPaymentIntent: PaymentIntentDto = {
        ...paymentIntent,
        paymentMethodId: testPaymentMethod.id,
      };

      return await this.createPaymentIntent(fullPaymentIntent);
    } catch (error) {
      this.logger.error(`Error creating PaymentIntent with test card: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { UsersService } from 'src/users/users.service';
import Stripe from 'stripe';
import { BankDetailsDto, UpdateBankDetailsDto } from './dto/input/bank-details.dto';
import { ConfirmPaymentIntentDto } from './dto/input/confirm-payment.dto';
import { CreateStripeAccountDto } from './dto/input/create-stripe-account.dto';
import { PaymentIntentDto } from './dto/input/payment-intent.dto';
import { PaymentIntentTestDto } from './dto/input/payment-intent-test.dto';
import { BankAccountListResponseDataDto } from './dto/output/bankAccount-list-response.dto';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  constructor(
    readonly _prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.stripe = new Stripe(this.configService.getOrThrow('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
    this.logger.setContext(PaymentService.name);
  }

  async createStripeAccountToken(userUid: string, stripeAccountData: CreateStripeAccountDto) {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.createStripeAccountToken);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const accountToken = await this.stripe.tokens.create({
        account: {
          business_type: 'individual',
          individual: {
            address: {
              city: stripeAccountData.address.city, // city : Paris
              country: stripeAccountData.address.countryCode, // pays : FR
              line1: stripeAccountData.address.line1, // address : 123 Main St
              line2: stripeAccountData.address.line2, // address complement : Apt 1
              postal_code: stripeAccountData.address.postalCode, // postal code : 94000
            },
            dob: {
              day: new Date(user.birthdate).getUTCDate(),
              month: new Date(user.birthdate).getUTCMonth() + 1,
              year: new Date(user.birthdate).getUTCFullYear(),
            },
            email: user.email,
            first_name: stripeAccountData.firstname,
            last_name: stripeAccountData.lastname,
            phone: user.phone,
          },
          tos_shown_and_accepted: true, // Confirms that the user accepts the Stripe terms of service
        },
      });
      return accountToken.id;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createStripeConnectAccount(
    userUid: string,
    stripeAccountData: CreateStripeAccountDto,
  ): Promise<void> {
    try {
      const existingUser = await this.usersService.findOne(
        userUid,
        USERSELECT.createStripeConnectAccount,
      );

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      if (existingUser.stripeAccountId) {
        throw new BadRequestException('Stripe account already exists');
      }

      const stripeAccountToken = await this.createStripeAccountToken(userUid, stripeAccountData);

      const stripeAccount = await this.stripe.accounts.create({
        account_token: stripeAccountToken,
        business_profile: {
          mcc: '7299',
          product_description: 'Participate to sessions in the app',
          url: null,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: stripeAccountData.address.countryCode, // country : FR
        email: existingUser.email,
        type: 'custom',
      });

      await this.usersService.addStripeAccountId(userUid, stripeAccount.id);

      this.logger.info(`Stripe account created for user ${userUid}: ${stripeAccount.id}`);
    } catch (error) {
      this.logger.error(`Error creating Stripe account for user ${userUid}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getStripeConnectAccount(userUid: string): Promise<Stripe.Account> {
    const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeAccountId) {
      throw new NotFoundException('Stripe account not found');
    }

    const stripeAccountId = user.stripeAccountId;
    const stripeAccount = await this.stripe.accounts.retrieve(stripeAccountId);
    return stripeAccount;
  }

  async deleteStripeConnectAccount(userUid: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      const stripeAccountId = user.stripeAccountId;

      const deletedAccount = await this.stripe.accounts.del(stripeAccountId);

      if (deletedAccount) {
        await this.usersService.removeStripeAccountId(userUid);
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
  async createPaymentIntent(paymentIntent: PaymentIntentDto): Promise<Stripe.PaymentIntent> {
    const { amount, connectedAccountId, currency, paymentMethodId } = paymentIntent;
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

      this.logger.info(`PaymentIntent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming PaymentIntent: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async addBankAccount(userUid: string, bankDetails: BankDetailsDto): Promise<void> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      const stripeAccountId = user.stripeAccountId;

      const userBankAccount = await this.stripe.accounts.listExternalAccounts(stripeAccountId, {
        object: 'bank_account',
      });
      if (userBankAccount.data.length >= 4) {
        throw new BadRequestException('You can only have 4 bank accounts');
      }
      await this.stripe.accounts.createExternalAccount(stripeAccountId, {
        external_account: {
          account_holder_name: bankDetails.holderName,
          account_holder_type: 'individual',
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
    userUid: string,
  ): Promise<PaginatedDataDto<BankAccountListResponseDataDto>> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      const stripeAccountId = user.stripeAccountId;

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

  async getBankAccount(userUid: string, bankAccountId: string): Promise<Stripe.ExternalAccount> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      const bankAccount = await this.stripe.accounts.retrieveExternalAccount(
        user.stripeAccountId,
        bankAccountId,
      );
      return bankAccount;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateDefaultBankAccount(
    userUid: string,
    bankAccountId: string,
    bankDetails: UpdateBankDetailsDto,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      await this.stripe.accounts.updateExternalAccount(user.stripeAccountId, bankAccountId, {
        default_for_currency: bankDetails.defaultForCurrency,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteBankAccount(userUid: string, bankAccountId: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(userUid, USERSELECT.stripeAccountId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripeAccountId) {
        throw new NotFoundException('Stripe account not found');
      }

      await this.stripe.accounts.deleteExternalAccount(user.stripeAccountId, bankAccountId);
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

      this.logger.info(`Test PaymentMethod retrieved: ${paymentMethod.id}`);
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

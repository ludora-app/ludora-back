import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCreateStripeAccountDto } from 'src/payment/dto/input/create-stripe-account.dto';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('stripe_secret_key'),
  };

  const mockStripe = {
    tokens: {
      create: jest.fn(),
    },
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
      del: jest.fn(),
      listExternalAccounts: jest.fn(),
      createExternalAccount: jest.fn(),
      retrieveExternalAccount: jest.fn(),
      updateExternalAccount: jest.fn(),
      deleteExternalAccount: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock Stripe instance
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeAccountToken', () => {
    const userId = 'user-1';
    const stripeAccountData: CreateCreateStripeAccountDto = {
      firstname: 'John',
      lastname: 'Doe',
      address: {
        city: 'Paris',
        country: 'France',
        countryCode: 'FR',
        line1: '123 Main St',
        line2: 'Apt 1',
        postalCode: '75001',
      },
      currency: 'eur',
    };

    it('should create a Stripe account token successfully', async () => {
      const mockUser = {
        birthdate: new Date('1990-01-01'),
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+1234567890',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripe.tokens.create.mockResolvedValue({ id: 'token-1' });

      const result = await service.createStripeAccountToken(userId, stripeAccountData);

      expect(result).toBe('token-1');
      expect(mockStripe.tokens.create).toHaveBeenCalledWith({
        account: {
          business_type: 'individual',
          individual: {
            address: {
              city: 'Paris',
              country: 'FR',
              line1: '123 Main St',
              line2: 'Apt 1',
              postal_code: '75001',
            },
            dob: {
              day: 1,
              month: 1,
              year: 1990,
            },
            email: 'john@example.com',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+1234567890',
          },
          tos_shown_and_accepted: true,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.createStripeAccountToken(userId, stripeAccountData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createStripeConnectAccount', () => {
    const userId = 'user-1';
    const stripeAccountData: CreateCreateStripeAccountDto = {
      firstname: 'John',
      lastname: 'Doe',
      address: {
        city: 'Paris',
        countryCode: 'FR',
        country: 'France',
        line1: '123 Main St',
        line2: 'Apt 1',
        postalCode: '75001',
      },
      currency: 'eur',
    };

    it('should create a Stripe Connect account successfully', async () => {
      const mockUser = {
        id: userId,
        email: 'john@example.com',
        stripeAccountId: null,
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripe.tokens.create.mockResolvedValue({ id: 'token-1' });
      mockStripe.accounts.create.mockResolvedValue({ id: 'account-1' });
      mockPrismaService.users.update.mockResolvedValue({
        ...mockUser,
        stripeAccountId: 'account-1',
      });

      const result = await service.createStripeConnectAccount(userId, stripeAccountData);

      expect(result).toEqual({
        message: 'stripe connect account created',
        status: 201,
      });
      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        account_token: 'token-1',
        business_profile: {
          mcc: '7299',
          product_description: 'Participate to events in the app',
          url: null,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: 'FR',
        email: 'john@example.com',
        type: 'custom',
      });
    });

    it('should throw BadRequestException if Stripe account already exists', async () => {
      const mockUser = {
        id: userId,
        email: 'john@example.com',
        stripeAccountId: 'existing-account',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.createStripeConnectAccount(userId, stripeAccountData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStripeConnectAccount', () => {
    const userId = 'user-1';

    it('should retrieve Stripe Connect account successfully', async () => {
      const mockUser = {
        stripeAccountId: 'account-1',
      };
      const mockStripeAccount = {
        id: 'account-1',
        email: 'john@example.com',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);

      const result = await service.getStripeConnectAccount(userId);

      expect(result).toEqual({
        data: mockStripeAccount,
        message: 'stripe connect account fetched',
        status: 200,
      });
    });

    it('should throw InternalServerErrorException if Stripe account not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ stripeAccountId: null });

      await expect(service.getStripeConnectAccount(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deleteStripeConnectAccount', () => {
    const userId = 'user-1';

    it('should delete Stripe Connect account successfully', async () => {
      const mockUser = {
        stripeAccountId: 'account-1',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripe.accounts.del.mockResolvedValue({ deleted: true });
      mockPrismaService.users.update.mockResolvedValue({ ...mockUser, stripeAccountId: null });

      const result = await service.deleteStripeConnectAccount(userId);

      expect(result).toEqual({
        message: 'account deleted successfully',
        status: 200,
      });
    });

    it('should throw BadRequestException if Stripe account not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ stripeAccountId: null });

      await expect(service.deleteStripeConnectAccount(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPaymentIntent', () => {
    const paymentIntentDto: PaymentIntentDto = {
      amount: 1000,
      connectedAccountId: 'account-1',
      currency: 'eur',
      paymentMethodId: 'pm_1',
    };

    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_1',
        amount: 1000,
        currency: 'eur',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(paymentIntentDto);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        confirm: true,
        currency: 'eur',
        payment_method: 'pm_1',
        transfer_data: {
          destination: 'account-1',
        },
      });
    });
  });

  describe('bank account operations', () => {
    const userId = 'user-1';
    const bankAccountId = 'ba_1';
    const bankDetails: BankDetailsDto = {
      accountNumber: 'FR123456789',
      holderName: 'John Doe',
      routingNumber: '12345',
    };

    describe('addBankAccount', () => {
      it('should add bank account successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({ data: [] });
        mockStripe.accounts.createExternalAccount.mockResolvedValue({ id: bankAccountId });

        const result = await service.addBankAccount(userId, bankDetails);

        expect(result).toEqual({
          message: 'Bank account added successfully',
          status: 201,
        });
      });

      it('should throw BadRequestException if maximum bank accounts reached', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({
          data: Array(4).fill({ id: 'existing-account' }),
        });

        await expect(service.addBankAccount(userId, bankDetails)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getBankAccountsList', () => {
      it('should get bank accounts list successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };
        const mockBankAccounts = [
          {
            id: 'ba_1',
            bank_name: 'Bank',
            country: 'FR',
            currency: 'eur',
            default_for_currency: true,
            last4: '1234',
            status: 'verified',
          },
        ];

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({
          data: mockBankAccounts,
        });

        const result = await service.getBankAccountsList(userId);

        expect(result).toEqual({
          data: {
            items: mockBankAccounts,
            nextCursor: null,
            totalCount: 1,
          },
          message: 'Bank accounts fetched successfully',
          status: 200,
        });
      });
    });

    describe('getBankAccount', () => {
      it('should get bank account successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };
        const mockBankAccount = {
          id: bankAccountId,
          bank_name: 'Bank',
          country: 'FR',
          currency: 'eur',
          default_for_currency: true,
          last4: '1234',
          status: 'verified',
        };

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.retrieveExternalAccount.mockResolvedValue(mockBankAccount);

        const result = await service.getBankAccount(userId, bankAccountId);

        expect(result).toEqual({
          data: mockBankAccount,
          message: 'Bank account fetched successfully',
          status: 200,
        });
      });
    });

    describe('updateDefaultBankAccount', () => {
      it('should update bank account successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };
        const updateDetails: UpdateBankDetailsDto = {
          defaultForCurrency: true,
        };

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.updateExternalAccount.mockResolvedValue({ id: bankAccountId });

        const result = await service.updateDefaultBankAccount(userId, bankAccountId, updateDetails);

        expect(result).toEqual({
          message: 'Bank account updated successfully',
          status: 200,
        });
      });
    });

    describe('deleteBankAccount', () => {
      it('should delete bank account successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };

        mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
        mockStripe.accounts.deleteExternalAccount.mockResolvedValue({ deleted: true });

        const result = await service.deleteBankAccount(userId, bankAccountId);

        expect(result).toEqual({
          message: 'banck account deleted successfully',
          status: 200,
        });
      });
    });
  });
});

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';
import { CreateStripeAccountDto } from 'src/payment/dto/input/create-stripe-account.dto';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let _prismaService: PrismaService;
  let _usersService: UsersService;
  let _configService: ConfigService;
  let _logger: PinoLogger;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('stripe_secret_key'),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    addStripeAccountId: jest.fn(),
    removeStripeAccountId: jest.fn(),
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
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
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
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _usersService = module.get<UsersService>(UsersService);
    _configService = module.get<ConfigService>(ConfigService);
    _logger = module.get<PinoLogger>(PinoLogger);
    // Mock Stripe instance
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeAccountToken', () => {
    const userId = 'user-1';
    const stripeAccountData: CreateStripeAccountDto = {
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

      mockUsersService.findOne.mockResolvedValue(mockUser);
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

    it('should throw InternalServerErrorException if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.createStripeAccountToken(userId, stripeAccountData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createStripeConnectAccount', () => {
    const userId = 'user-1';
    const stripeAccountData: CreateStripeAccountDto = {
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
        uid: userId,
        email: 'john@example.com',
        birthdate: new Date('1990-01-01'),
        phone: '+1234567890',
        stripeAccountId: null,
      };

      mockUsersService.findOne
        .mockResolvedValueOnce(mockUser) // First call in createStripeAccountToken
        .mockResolvedValueOnce(mockUser); // Second call in createStripeConnectAccount
      mockStripe.tokens.create.mockResolvedValue({ id: 'token-1' });
      mockStripe.accounts.create.mockResolvedValue({ id: 'account-1' });
      mockUsersService.addStripeAccountId.mockResolvedValue(undefined);

      await service.createStripeConnectAccount(userId, stripeAccountData);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        account_token: 'token-1',
        business_profile: {
          mcc: '7299',
          product_description: 'Participate to sessions in the app',
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
      expect(mockUsersService.addStripeAccountId).toHaveBeenCalledWith(userId, 'account-1');
    });

    it('should throw BadRequestException if Stripe account already exists', async () => {
      const mockUser = {
        uid: userId,
        email: 'john@example.com',
        birthdate: new Date('1990-01-01'),
        phone: '+1234567890',
        stripeAccountId: 'existing-account',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockStripe.tokens.create.mockResolvedValue({ id: 'token-1' });

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

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockStripe.accounts.retrieve.mockResolvedValue(mockStripeAccount);

      const result = await service.getStripeConnectAccount(userId);

      expect(result).toEqual(mockStripeAccount);
      expect(mockStripe.accounts.retrieve).toHaveBeenCalledWith('account-1');
    });

    it('should throw NotFoundException if Stripe account not found', async () => {
      mockUsersService.findOne.mockResolvedValue({ stripeAccountId: null });

      await expect(service.getStripeConnectAccount(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStripeConnectAccount', () => {
    const userId = 'user-1';

    it('should delete Stripe Connect account successfully', async () => {
      const mockUser = {
        stripeAccountId: 'account-1',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockStripe.accounts.del.mockResolvedValue({ deleted: true, id: 'account-1' });
      mockUsersService.removeStripeAccountId.mockResolvedValue(undefined);

      await service.deleteStripeConnectAccount(userId);

      expect(mockStripe.accounts.del).toHaveBeenCalledWith('account-1');
      expect(mockUsersService.removeStripeAccountId).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException if Stripe account not found', async () => {
      mockUsersService.findOne.mockResolvedValue({ stripeAccountId: null });

      await expect(service.deleteStripeConnectAccount(userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if deletion fails', async () => {
      const mockUser = {
        stripeAccountId: 'account-1',
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockStripe.accounts.del.mockResolvedValue(null);

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
        currency: 'eur',
        payment_method: 'pm_1',
        automatic_payment_methods: {
          allow_redirects: 'never',
          enabled: true,
        },
        confirm: false,
        transfer_data: {
          destination: 'account-1',
        },
        metadata: {
          platform: 'mobile',
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

        mockUsersService.findOne.mockResolvedValue(mockUser);
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({ data: [] });
        mockStripe.accounts.createExternalAccount.mockResolvedValue({ id: bankAccountId });

        await service.addBankAccount(userId, bankDetails);

        expect(mockStripe.accounts.createExternalAccount).toHaveBeenCalledWith('account-1', {
          external_account: {
            account_holder_name: 'John Doe',
            account_holder_type: 'individual',
            account_number: 'FR123456789',
            country: 'FR',
            currency: 'eur',
            object: 'bank_account',
            routing_number: '12345',
          },
        });
      });

      it('should throw BadRequestException if maximum bank accounts reached', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };

        mockUsersService.findOne.mockResolvedValue(mockUser);
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
            account_holder_name: 'John Doe',
            last4: '1234',
            status: 'verified',
            routing_number: '12345',
            future_requirements: null,
            requirements: null,
          },
        ];

        mockUsersService.findOne.mockResolvedValue(mockUser);
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({
          data: mockBankAccounts,
        });

        const result = await service.getBankAccountsList(userId);

        expect(result).toEqual({
          items: [
            {
              id: 'ba_1',
              bank_name: 'Bank',
              country: 'FR',
              currency: 'eur',
              default_for_currency: true,
              holder_name: 'John Doe',
              last4: '1234',
              status: 'verified',
              routing_number: '12345',
              future_requirements: null,
              requirements: null,
            },
          ],
          nextCursor: null,
          totalCount: 1,
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

        mockUsersService.findOne.mockResolvedValue(mockUser);
        mockStripe.accounts.retrieveExternalAccount.mockResolvedValue(mockBankAccount);

        const result = await service.getBankAccount(userId, bankAccountId);

        expect(result).toEqual(mockBankAccount);
        expect(mockStripe.accounts.retrieveExternalAccount).toHaveBeenCalledWith(
          'account-1',
          bankAccountId,
        );
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

        mockUsersService.findOne.mockResolvedValue(mockUser);
        mockStripe.accounts.updateExternalAccount.mockResolvedValue({ id: bankAccountId });

        await service.updateDefaultBankAccount(userId, bankAccountId, updateDetails);

        expect(mockStripe.accounts.updateExternalAccount).toHaveBeenCalledWith(
          'account-1',
          bankAccountId,
          { default_for_currency: true },
        );
      });
    });

    describe('deleteBankAccount', () => {
      it('should delete bank account successfully', async () => {
        const mockUser = {
          stripeAccountId: 'account-1',
        };

        mockUsersService.findOne.mockResolvedValue(mockUser);
        mockStripe.accounts.deleteExternalAccount.mockResolvedValue({ deleted: true });

        await service.deleteBankAccount(userId);

        expect(mockStripe.accounts.deleteExternalAccount).toHaveBeenCalledWith(
          'account-1',
          'account-1',
        );
      });
    });
  });
});

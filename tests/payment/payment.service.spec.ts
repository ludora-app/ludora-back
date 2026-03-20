import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';
import { ConfirmPaymentIntentDto } from 'src/payment/dto/input/confirm-payment.dto';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let _prismaService: PrismaService;
  let _configService: ConfigService;

  const mockPrismaService = {
    partners: {
      findUnique: jest.fn(),
    },
    partnerBillingConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    sessions: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('stripe_secret_key'),
    get: jest.fn().mockReturnValue('https://ludora.fr'),
  };

  const mockStripe = {
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
    accountLinks: {
      create: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    },
    paymentMethods: {
      retrieve: jest.fn(),
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
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _configService = module.get<ConfigService>(ConfigService);
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeConnectAccount', () => {
    const partnerUid = 'partner-1';

    it('should create a Stripe Connect account successfully', async () => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        name: 'Partner Corp',
        phone: '123456',
        address: '123 rue',
        city: 'Paris',
        zipCode: '75001',
        country: 'FR',
        email: 'test@partner.com',
        partnerBillingConfigs: null,
      });

      mockStripe.accounts.create.mockResolvedValue({ id: 'acct_123' });

      await service.createStripeConnectAccount(partnerUid);

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'express' }),
      );
      expect(mockPrismaService.partnerBillingConfig.upsert).toHaveBeenCalled();
    });

    it('should throw BadRequestException if Stripe account already exists', async () => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        partnerBillingConfigs: { stripeAccountId: 'acct_existing' },
      });

      await expect(service.createStripeConnectAccount(partnerUid)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateStripeAccountLink', () => {
    const partnerUid = 'partner-1';

    it('should generate link successfully', async () => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        partnerBillingConfigs: { stripeAccountId: 'acct_123' },
      });
      mockStripe.accountLinks.create.mockResolvedValue({ url: 'https://link' });

      const res = await service.generateStripeAccountLink(partnerUid);
      expect(res.url).toBe('https://link');
    });
  });

  describe('getStripeConnectAccount', () => {
    const partnerUid = 'partner-1';

    it('should retrieve Stripe Connect account successfully', async () => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        partnerBillingConfigs: { stripeAccountId: 'acct_123' },
      });
      mockStripe.accounts.retrieve.mockResolvedValue({ id: 'acct_123' });

      const result = await service.getStripeConnectAccount(partnerUid);
      expect(result.id).toBe('acct_123');
    });
  });

  describe('deleteStripeConnectAccount', () => {
    const partnerUid = 'partner-1';

    it('should delete Stripe Connect account successfully', async () => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        partnerBillingConfigs: { stripeAccountId: 'acct_123' },
      });
      mockStripe.accounts.del.mockResolvedValue({ deleted: true, id: 'acct_123' });

      await service.deleteStripeConnectAccount(partnerUid);

      expect(mockStripe.accounts.del).toHaveBeenCalledWith('acct_123');
      expect(mockPrismaService.partnerBillingConfig.update).toHaveBeenCalled();
    });
  });

  describe('createPaymentIntent', () => {
    const paymentIntentDto: PaymentIntentDto = {
      amount: 1000,
      currency: 'eur',
      sessionUid: 'session-1',
      userUid: 'user-1',
      paymentMethodId: 'pm_1',
    };

    it('should create payment intent successfully', async () => {
      mockPrismaService.sessions.findUnique.mockResolvedValue({
        uid: 'session-1',
        field: { partnerUid: 'partner-1' },
      });
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: 'partner-1',
        partnerBillingConfigs: { stripeAccountId: 'acct_dest' },
      });
      mockPrismaService.partnerBillingConfig.findUnique.mockResolvedValue({ commissionRate: 0.15 });

      mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_1' });

      const result = await service.createPaymentIntent(paymentIntentDto);

      expect(result).toBeDefined();
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent successfully', async () => {
      const dto: ConfirmPaymentIntentDto = { paymentIntentId: 'pi_1', paymentMethodId: 'pm_1' };
      mockStripe.paymentIntents.confirm.mockResolvedValue({ id: 'pi_1' });

      const result = await service.confirmPaymentIntent(dto);
      expect(result.id).toBe('pi_1');
    });
  });

  describe('bank account operations', () => {
    const partnerUid = 'partner-1';
    const bankAccountId = 'ba_1';
    const bankDetails: BankDetailsDto = {
      accountNumber: 'FR123456789',
      holderName: 'John Doe',
      routingNumber: '12345',
    };

    beforeEach(() => {
      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: partnerUid,
        partnerBillingConfigs: { stripeAccountId: 'acct_123' },
      });
    });

    describe('addBankAccount', () => {
      it('should add bank account successfully', async () => {
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({ data: [] });
        mockStripe.accounts.createExternalAccount.mockResolvedValue({ id: bankAccountId });

        await service.addBankAccount(partnerUid, bankDetails);

        expect(mockStripe.accounts.createExternalAccount).toHaveBeenCalled();
      });

      it('should throw BadRequestException if maximum bank accounts reached', async () => {
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({
          data: Array(4).fill({ id: 'existing-account' }),
        });

        await expect(service.addBankAccount(partnerUid, bankDetails)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getBankAccountsList', () => {
      it('should get bank accounts list successfully', async () => {
        mockStripe.accounts.listExternalAccounts.mockResolvedValue({
          data: [
            { id: 'ba_1', bank_name: 'Bank', country: 'FR', currency: 'eur', status: 'verified' },
          ],
        });

        const result = await service.getBankAccountsList(partnerUid);
        expect(result.items).toHaveLength(1);
      });
    });

    describe('getBankAccount', () => {
      it('should get bank account successfully', async () => {
        mockStripe.accounts.retrieveExternalAccount.mockResolvedValue({ id: 'ba_1' });
        const result = await service.getBankAccount(partnerUid, bankAccountId);
        expect(result.id).toBe('ba_1');
      });
    });

    describe('updateDefaultBankAccount', () => {
      it('should update bank account successfully', async () => {
        const updateDetails: UpdateBankDetailsDto = { defaultForCurrency: true };
        mockStripe.accounts.updateExternalAccount.mockResolvedValue({ id: bankAccountId });
        await service.updateDefaultBankAccount(partnerUid, bankAccountId, updateDetails);
        expect(mockStripe.accounts.updateExternalAccount).toHaveBeenCalled();
      });
    });

    describe('deleteBankAccount', () => {
      it('should delete bank account successfully', async () => {
        mockStripe.accounts.deleteExternalAccount.mockResolvedValue({ deleted: true });
        await service.deleteBankAccount(partnerUid, bankAccountId);
        expect(mockStripe.accounts.deleteExternalAccount).toHaveBeenCalled();
      });
    });
  });

  describe('testing methods', () => {
    it('createPaymentMethodForTesting should retrieve mock pm', async () => {
      mockStripe.paymentMethods.retrieve.mockResolvedValue({ id: 'pm_card_visa' });
      const res = await service.createPaymentMethodForTesting();
      expect(res.id).toBe('pm_card_visa');
    });
  });
});

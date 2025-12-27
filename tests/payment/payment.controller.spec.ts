import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentController } from 'src/payment/payment.controller';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';
import { CreateStripeAccountDto } from 'src/payment/dto/input/create-stripe-account.dto';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockStripeService = {
    createStripeConnectAccount: jest.fn(),
    getStripeConnectAccount: jest.fn(),
    deleteStripeConnectAccount: jest.fn(),
    createPaymentIntent: jest.fn(),
    addBankAccount: jest.fn(),
    getBankAccountsList: jest.fn(),
    getBankAccount: jest.fn(),
    updateDefaultBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return 'test';
      }
      return undefined;
    }),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockDevOnlyGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRequest = {
    user: {
      id: 'user-1',
      uid: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockStripeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(DevOnlyGuard)
      .useValue(mockDevOnlyGuard)
      .compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStripeConnectAccount', () => {
    it('should get Stripe Connect account', async () => {
      const mockAccount = { id: 'account-1', email: 'test@example.com' };

      mockStripeService.getStripeConnectAccount.mockResolvedValue(mockAccount);

      const result = await controller.getStripeConnectAccount(mockRequest as any);

      expect(result).toEqual({
        data: mockAccount,
        message: 'stripe connect account fetched',
      });
      expect(mockStripeService.getStripeConnectAccount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createStripeConnectAccount', () => {
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

    it('should create Stripe Connect account', async () => {
      mockStripeService.createStripeConnectAccount.mockResolvedValue(undefined);

      await controller.createStripeConnectAccount(mockRequest as any, stripeAccountData);

      expect(mockStripeService.createStripeConnectAccount).toHaveBeenCalledWith(
        'user-1',
        stripeAccountData,
      );
    });
  });

  // describe('deleteStripeConnectAccount', () => {
  //   it('should delete Stripe Connect account', async () => {
  //     const expectedResult = {
  //       message: 'account deleted successfully',
  //
  //     };

  //     mockStripeService.deleteStripeConnectAccount.mockResolvedValue(expectedResult);

  //     const result = await controller.deleteStripeConnectAccount(mockRequest as any);

  //     expect(result).toEqual(expectedResult);
  //     expect(mockStripeService.deleteStripeConnectAccount).toHaveBeenCalledWith('user-1');
  //   });
  // });

  describe('createPaymentIntent', () => {
    const paymentIntentData: PaymentIntentDto = {
      amount: 1000,
      connectedAccountId: 'account-1',
      paymentMethodId: 'pm_1',
      currency: 'eur',
    };

    it('should create payment intent', async () => {
      const expectedResult = {
        id: 'pi_1',
        amount: 1000,
        currency: 'eur',
      };

      mockStripeService.createPaymentIntent.mockResolvedValue(expectedResult);

      const result = await controller.createPaymentIntent(paymentIntentData);

      expect(result).toEqual(expectedResult);
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(paymentIntentData);
    });
  });

  describe('bank account operations', () => {
    const bankDetails: BankDetailsDto = {
      accountNumber: 'FR123456789',
      holderName: 'John Doe',
      routingNumber: '12345',
    };

    describe('addBankAccount', () => {
      it('should add bank account', async () => {
        mockStripeService.addBankAccount.mockResolvedValue(undefined);

        await controller.addBankAccount(bankDetails, mockRequest as any);

        expect(mockStripeService.addBankAccount).toHaveBeenCalledWith('user-1', bankDetails);
      });
    });

    describe('getBankAccountsList', () => {
      it('should get bank accounts list', async () => {
        const mockData = {
          items: [
            {
              id: 'ba_1',
              bank_name: 'Bank',
              country: 'FR',
              currency: 'eur',
              default_for_currency: true,
              last4: '1234',
              status: 'verified',
            },
          ],
          nextCursor: null,
          totalCount: 1,
        };

        mockStripeService.getBankAccountsList.mockResolvedValue(mockData);

        const result = await controller.getBankAccountsList(mockRequest as any);

        expect(result).toEqual({
          data: mockData,
          message: 'Bank accounts fetched successfully',
        });
        expect(mockStripeService.getBankAccountsList).toHaveBeenCalledWith('user-1');
      });
    });

    describe('getBankAccount', () => {
      const bankAccountId = 'ba_1';

      it('should get bank account', async () => {
        const mockBankAccount = {
          id: bankAccountId,
          bank_name: 'Bank',
          country: 'FR',
          currency: 'eur',
          default_for_currency: true,
          last4: '1234',
          status: 'verified',
        };

        mockStripeService.getBankAccount.mockResolvedValue(mockBankAccount);

        const result = await controller.getBankAccount(mockRequest as any, bankAccountId);

        expect(result).toEqual({
          data: mockBankAccount,
          message: 'Bank account retrieved successfully',
        });
        expect(mockStripeService.getBankAccount).toHaveBeenCalledWith('user-1', bankAccountId);
      });
    });

    describe('updateBankAccount', () => {
      const bankAccountId = 'ba_1';
      const updateDetails: UpdateBankDetailsDto = {
        defaultForCurrency: true,
      };

      it('should update bank account', async () => {
        mockStripeService.updateDefaultBankAccount.mockResolvedValue(undefined);

        await controller.updateBankAccount(updateDetails, mockRequest as any, bankAccountId);

        expect(mockStripeService.updateDefaultBankAccount).toHaveBeenCalledWith(
          'user-1',
          bankAccountId,
          updateDetails,
        );
      });
    });

    describe('deleteBankAccount', () => {
      const bankAccountId = 'ba_1';

      it('should delete bank account', async () => {
        mockStripeService.deleteBankAccount.mockResolvedValue(undefined);

        await controller.deleteBankAccount(bankAccountId, mockRequest as any);

        expect(mockStripeService.deleteBankAccount).toHaveBeenCalledWith('user-1', bankAccountId);
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from 'src/payment/payment.controller';
import { PaymentService } from 'src/payment/payment.service';
import { CreateCreateStripeAccountDto } from 'src/payment/dto/input/create-stripe-account.dto';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';

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

  const mockRequest = {
    user: {
      id: 'user-1',
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
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStripeConnectAccount', () => {
    it('should get Stripe Connect account', async () => {
      const expectedResult = {
        data: { id: 'account-1' },
        message: 'stripe connect account fetched',
        status: 200,
      };

      mockStripeService.getStripeConnectAccount.mockResolvedValue(expectedResult);

      const result = await controller.getStripeConnectAccount(mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockStripeService.getStripeConnectAccount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createStripeConnectAccount', () => {
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

    it('should create Stripe Connect account', async () => {
      const expectedResult = {
        message: 'stripe connect account created',
        status: 201,
      };

      mockStripeService.createStripeConnectAccount.mockResolvedValue(expectedResult);

      const result = await controller.createStripeConnectAccount(
        mockRequest as any,
        stripeAccountData,
      );

      expect(result).toEqual(expectedResult);
      expect(mockStripeService.createStripeConnectAccount).toHaveBeenCalledWith(
        'user-1',
        stripeAccountData,
      );
    });
  });

  describe('deleteStripeConnectAccount', () => {
    it('should delete Stripe Connect account', async () => {
      const expectedResult = {
        message: 'account deleted successfully',
        status: 200,
      };

      mockStripeService.deleteStripeConnectAccount.mockResolvedValue(expectedResult);

      const result = await controller.deleteStripeConnectAccount(mockRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockStripeService.deleteStripeConnectAccount).toHaveBeenCalledWith('user-1');
    });
  });

  describe('createPaymentIntent', () => {
    const paymentIntentData = {
      amount: 1000,
      connectedAccountId: 'account-1',
      paymentMethodId: 'pm_1',
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
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith({
        ...paymentIntentData,
        currency: 'EUR',
      });
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
        const expectedResult = {
          message: 'Bank account added successfully',
          status: 201,
        };

        mockStripeService.addBankAccount.mockResolvedValue(expectedResult);

        const result = await controller.addBankAccount(bankDetails, mockRequest as any);

        expect(result).toEqual(expectedResult);
        expect(mockStripeService.addBankAccount).toHaveBeenCalledWith('user-1', bankDetails);
      });
    });

    describe('getBankAccountsList', () => {
      it('should get bank accounts list', async () => {
        const expectedResult = {
          data: {
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
          },
          message: 'Bank accounts fetched successfully',
          status: 200,
        };

        mockStripeService.getBankAccountsList.mockResolvedValue(expectedResult);

        const result = await controller.getBankAccountsList(mockRequest as any);

        expect(result).toEqual(expectedResult);
        expect(mockStripeService.getBankAccountsList).toHaveBeenCalledWith('user-1');
      });
    });

    describe('getBankAccount', () => {
      const bankAccountId = 'ba_1';

      it('should get bank account', async () => {
        const expectedResult = {
          data: {
            id: bankAccountId,
            bank_name: 'Bank',
            country: 'FR',
            currency: 'eur',
            default_for_currency: true,
            last4: '1234',
            status: 'verified',
          },
          message: 'Bank account fetched successfully',
          status: 200,
        };

        mockStripeService.getBankAccount.mockResolvedValue(expectedResult);

        const result = await controller.getBankAccount(mockRequest as any, bankAccountId);

        expect(result).toEqual(expectedResult);
        expect(mockStripeService.getBankAccount).toHaveBeenCalledWith('user-1', bankAccountId);
      });
    });

    describe('updateBankAccount', () => {
      const bankAccountId = 'ba_1';
      const updateDetails: UpdateBankDetailsDto = {
        defaultForCurrency: true,
      };

      it('should update bank account', async () => {
        const expectedResult = {
          message: 'Bank account updated successfully',
          status: 200,
        };

        mockStripeService.updateDefaultBankAccount.mockResolvedValue(expectedResult);

        const result = await controller.updateBankAccount(
          updateDetails,
          mockRequest as any,
          bankAccountId,
        );

        expect(result).toEqual(expectedResult);
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
        const expectedResult = {
          message: 'banck account deleted successfully',
          status: 200,
        };

        mockStripeService.deleteBankAccount.mockResolvedValue(expectedResult);

        const result = await controller.deleteBankAccount(bankAccountId, mockRequest as any);

        expect(result).toEqual(expectedResult);
        expect(mockStripeService.deleteBankAccount).toHaveBeenCalledWith('user-1', bankAccountId);
      });
    });
  });
});

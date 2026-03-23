import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2BGuard } from 'src/auth/guards/auth-b2b.guard';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { BankDetailsDto, UpdateBankDetailsDto } from 'src/payment/dto/input/bank-details.dto';
import { ConfirmPaymentIntentDto } from 'src/payment/dto/input/confirm-payment.dto';
import { PaymentIntentDto } from 'src/payment/dto/input/payment-intent.dto';
import { PaymentIntentTestDto } from 'src/payment/dto/input/payment-intent-test.dto';
import { PaymentController } from 'src/payment/payment.controller';
import { PaymentService } from 'src/payment/payment.service';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';

describe('PaymentController', () => {
  let controller: PaymentController;
  let _service: PaymentService;

  const mockPaymentService = {
    createStripeConnectAccount: jest.fn(),
    generateStripeAccountLink: jest.fn(),
    getStripeConnectAccount: jest.fn(),
    deleteStripeConnectAccount: jest.fn(),
    createPaymentIntent: jest.fn(),
    confirmPaymentIntent: jest.fn(),
    addBankAccount: jest.fn(),
    getBankAccountsList: jest.fn(),
    getBankAccount: jest.fn(),
    updateDefaultBankAccount: jest.fn(),
    deleteBankAccount: jest.fn(),
    createPaymentIntentWithTestCard: jest.fn(),
    createPaymentMethodForTesting: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    }),
  };

  const mockAuthGuard = { canActivate: jest.fn(() => true) };
  const mockDevOnlyGuard = { canActivate: jest.fn(() => true) };

  const mockRequestB2C = { user: { uid: 'user-1' } };
  const mockRequestB2B = { user: { organisationUid: 'org-1' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(AuthB2BGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(DevOnlyGuard)
      .useValue(mockDevOnlyGuard)
      .compile();

    controller = module.get<PaymentController>(PaymentController);
    _service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createStripeConnectAccount should call service', async () => {
    await controller.createStripeConnectAccount(mockRequestB2B as any);
    expect(mockPaymentService.createStripeConnectAccount).toHaveBeenCalledWith('org-1');
  });

  it('generateStripeAccountLink should return link', async () => {
    mockPaymentService.generateStripeAccountLink.mockResolvedValue({ url: 'link' });
    const result = await controller.generateStripeAccountLink(mockRequestB2B as any);
    expect(result.url).toBe('link');
  });

  it('refreshStripeAccountLink should return link', async () => {
    mockPaymentService.generateStripeAccountLink.mockResolvedValue({ url: 'link2' });
    const result = await controller.refreshStripeAccountLink(mockRequestB2B as any);
    expect(result.url).toBe('link2');
  });

  it('createPaymentIntent should call service', async () => {
    const dto: PaymentIntentDto = {
      amount: 1000,
      currency: 'eur',
      sessionUid: '1',
      userUid: '2',
      paymentMethodId: 'pm',
    };
    mockPaymentService.createPaymentIntent.mockResolvedValue({ id: 'pi_1' });
    const res = await controller.createPaymentIntent(dto);
    expect(res).toEqual({ id: 'pi_1' });
  });

  it('confirmPaymentIntent should call service', async () => {
    const dto: ConfirmPaymentIntentDto = { paymentIntentId: 'pi_1' };
    mockPaymentService.confirmPaymentIntent.mockResolvedValue({ id: 'pi_1' });
    const res = await controller.confirmPaymentIntent(dto);
    expect(res).toEqual({ id: 'pi_1' });
  });

  it('addBankAccount should call service', async () => {
    const dto: BankDetailsDto = { accountNumber: '123', holderName: 'A', routingNumber: '1' };
    await controller.addBankAccount(dto, mockRequestB2C as any);
    expect(mockPaymentService.addBankAccount).toHaveBeenCalledWith('user-1', dto);
  });

  it('getStripeConnectAccount should return account', async () => {
    mockPaymentService.getStripeConnectAccount.mockResolvedValue({ id: 'acct' });
    const result = await controller.getStripeConnectAccount(mockRequestB2B as any);
    expect(result.data.id).toBe('acct');
    expect(result.message).toBeDefined();
  });

  it('getBankAccountsList should return list', async () => {
    mockPaymentService.getBankAccountsList.mockResolvedValue({ items: [], totalCount: 0 });
    const result = await controller.getBankAccountsList(mockRequestB2C as any);
    expect(result.data.items).toEqual([]);
  });

  it('getBankAccount should return one account', async () => {
    mockPaymentService.getBankAccount.mockResolvedValue({ id: 'ba_1' });
    const result = await controller.getBankAccount(mockRequestB2C as any, 'ba_1');
    expect(result.data.id).toBe('ba_1');
  });

  it('updateBankAccount should call service', async () => {
    const dto: UpdateBankDetailsDto = { defaultForCurrency: true };
    await controller.updateBankAccount(dto, mockRequestB2C as any, 'ba_1');
    expect(mockPaymentService.updateDefaultBankAccount).toHaveBeenCalledWith('user-1', 'ba_1', dto);
  });

  it('deleteBankAccount should call service', async () => {
    await controller.deleteBankAccount(mockRequestB2C as any, 'ba_1');
    expect(mockPaymentService.deleteBankAccount).toHaveBeenCalledWith('user-1', 'ba_1');
  });

  it('createPaymentIntentWithTestCard should call service', async () => {
    const dto: PaymentIntentTestDto = {
      amount: 100,
      currency: 'eur',
      sessionUid: '1',
      userUid: '2',
    };
    mockPaymentService.createPaymentIntentWithTestCard.mockResolvedValue({ id: 'pi_test' });
    const res = await controller.createPaymentIntentWithTestCard(dto);
    expect(res.data.id).toBe('pi_test');
  });

  it('createTestPaymentMethod should call service', async () => {
    mockPaymentService.createPaymentMethodForTesting.mockResolvedValue({ id: 'pm_test' });
    const res = await controller.createTestPaymentMethod();
    expect(res.id).toBe('pm_test');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2BController } from '../../src/auth-b2b/auth-b2b.controller';
import { AuthB2BService } from '../../src/auth-b2b/auth-b2b.service';
import { AuthB2BGuard } from '../../src/auth-b2b/guards/auth-b2b.guard';

describe('AuthB2BController', () => {
  let controller: AuthB2BController;

  const mockAuthB2BService = {
    register: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthB2BController],
      providers: [
        {
          provide: AuthB2BService,
          useValue: mockAuthB2BService,
        },
      ],
    })
      .overrideGuard(AuthB2BGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthB2BController>(AuthB2BController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new partner and user without file', async () => {
      const registerDto = {
        userEmail: 'partner@test.com',
        userFirstname: 'John',
        userLastname: 'Doe',
        userPassword: 'Password123!',
        userPhone: '+33612345678',
        partnerName: 'Test Partner',
        partnerAddress: '123 Main St',
        partnerEmail: 'contact@partner.com',
        partnerPhone: '+33612345679',
      };

      mockAuthB2BService.register.mockResolvedValue({
        accessToken: 'mock_b2b_token',
        refreshToken: 'mock_b2b_refresh_token',
      });

      const result = await controller.register(registerDto, undefined);

      expect(result).toEqual({
        data: { accessToken: 'mock_b2b_token', refreshToken: 'mock_b2b_refresh_token' },
        message: 'Partner and user created successfully',
        status: 201,
      });
      expect(mockAuthB2BService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should register a new partner and user with file', async () => {
      const registerDto = {
        userEmail: 'partner@test.com',
        userFirstname: 'John',
        userLastname: 'Doe',
        userPassword: 'Password123!',
        userPhone: '+33612345678',
        partnerName: 'Test Partner',
        partnerAddress: '123 Main St',
        partnerEmail: 'contact@partner.com',
        partnerPhone: '+33612345679',
      };

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'partner-logo.jpg',
      } as Express.Multer.File;

      mockAuthB2BService.register.mockResolvedValue({
        accessToken: 'mock_b2b_token',
        refreshToken: 'mock_b2b_refresh_token',
      });

      const result = await controller.register(registerDto, mockFile);

      expect(result).toEqual({
        data: { accessToken: 'mock_b2b_token', refreshToken: 'mock_b2b_refresh_token' },
        message: 'Partner and user created successfully',
        status: 201,
      });
      expect(mockAuthB2BService.register).toHaveBeenCalled();
      expect(mockAuthB2BService.register).toHaveBeenCalledWith(
        registerDto,
        expect.objectContaining({
          file: expect.any(Buffer),
          name: expect.stringContaining('partner-logo.jpg'),
        }),
      );
    });
  });
});

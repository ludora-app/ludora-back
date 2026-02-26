import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2BController } from 'src/auth/controllers/auth-b2b.controller';
import { AuthB2BGuard } from '../../../src/auth/guards/auth-b2b.guard';
import { AuthB2BService } from '../../../src/auth/services/auth-b2b.service';

describe('AuthB2BController', () => {
  let controller: AuthB2BController;

  const mockAuthB2BService = {
    register: jest.fn(),
    login: jest.fn(),
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

  describe('login', () => {
    it('should login a partner successfully', async () => {
      const loginDto = {
        email: 'partner@test.com',
        password: 'Password123!',
      };

      mockAuthB2BService.login.mockResolvedValue({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        data: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
        message: 'PARTNER user logged in successfully',
      });
      expect(mockAuthB2BService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should login a partner with deviceUid', async () => {
      const loginDto = {
        email: 'partner@test.com',
        password: 'Password123!',
        deviceUid: 'device-123',
      };

      mockAuthB2BService.login.mockResolvedValue({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        data: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
        message: 'PARTNER user logged in successfully',
      });
      expect(mockAuthB2BService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});

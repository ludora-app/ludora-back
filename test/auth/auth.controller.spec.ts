import { Test, TestingModule } from '@nestjs/testing';
import { Sex, User_type } from '@prisma/client';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { VerifyEmailCodeDto } from 'src/auth/dto/input/verify-email-code.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    resendVerificationCode: jest.fn(),
    verifyEmail: jest.fn(),
    verifyEmailCode: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user without file', async () => {
      const registerDto = {
        bio: 'Test bio',
        birthdate: new Date().toString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'password',
        phone: '1234567890',
        sex: Sex.MALE,
        type: User_type.USER,
      };

      mockAuthService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.register(registerDto, undefined);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'User created successfully',
        status: 201,
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should register a new user with file', async () => {
      const registerDto = {
        bio: 'Test bio',
        birthdate: new Date().toString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'password',
        phone: '1234567890',
        sex: Sex.MALE,
        type: User_type.USER,
      };

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;

      mockAuthService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.register(registerDto, mockFile);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'User created successfully',
        status: 201,
      });
      expect(mockAuthService.register).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password',
      };

      mockAuthService.login.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'Token created successfully',
        status: 200,
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email availability', async () => {
      const verifyMailDto = { email: 'test@test.com' };

      mockAuthService.verifyEmail.mockResolvedValue(true);

      const result = await controller.verifyEmail(verifyMailDto);

      expect(result).toEqual({
        data: { isAvailable: true },
        message: 'Email is available',
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(verifyMailDto);
    });
  });

  describe('verifyToken', () => {
    it('should verify token', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthService.verifyToken.mockResolvedValue(true);

      const result = await controller.verifyToken(mockRequest as any);

      expect(result).toEqual({
        data: { isValid: true },
        message: 'token is valid',
      });
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('1');
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify email code', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const dto: VerifyEmailCodeDto = { code: '123456' };

      mockAuthService.verifyEmailCode.mockResolvedValue(undefined);

      const result = await controller.verifyEmailCode(mockRequest as any, dto);

      expect(result).toEqual({
        message: 'Email vérifié avec succès',
        status: 200,
      });
      expect(mockAuthService.verifyEmailCode).toHaveBeenCalledWith('1', '123456');
    });
  });

  describe('resendVerificationCode', () => {
    it('should resend verification code', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthService.resendVerificationCode.mockResolvedValue(undefined);

      const result = await controller.resendVerificationCode(mockRequest as any);

      expect(result).toEqual({
        message: 'Nouveau code de vérification envoyé',
        status: 200,
      });
      expect(mockAuthService.resendVerificationCode).toHaveBeenCalledWith('1');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        data: { accessToken: 'new_access_token', refreshToken: 'new_refresh_token' },
        message: 'Tokens refreshed successfully',
        status: 200,
      });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('logout', () => {
    it('should logout from current device', async () => {
      const mockRequest = {
        user: { uid: '1', deviceUid: 'device123' },
      };

      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest as any);

      expect(result).toEqual({
        message: 'Logged out successfully',
        status: 200,
      });
      expect(mockAuthService.logout).toHaveBeenCalledWith('1', 'device123');
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthService.logoutAllDevices.mockResolvedValue(undefined);

      const result = await controller.logoutAllDevices(mockRequest as any);

      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
        status: 200,
      });
      expect(mockAuthService.logoutAllDevices).toHaveBeenCalledWith('1');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Sex, UserType } from 'generated/prisma/client';
import { AuthB2CController } from 'src/auth-b2c/auth-b2c.controller';
import { AuthB2CService } from 'src/auth-b2c/auth-b2c.service';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { VerifyEmailCodeDto } from 'src/auth-b2c/dto/input/verify-email-code.dto';

describe('AuthB2CController', () => {
  let controller: AuthB2CController;

  const mockAuthB2CService = {
    login: jest.fn(),
    register: jest.fn(),
    resendVerificationCode: jest.fn(),
    verifyEmail: jest.fn(),
    verifyEmailCode: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
    generateAccessTokenFromCode: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthB2CController],
      providers: [
        {
          provide: AuthB2CService,
          useValue: mockAuthB2CService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthB2CController>(AuthB2CController);
    module.get<AuthB2CService>(AuthB2CService);
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
        type: UserType.USER,
      };

      mockAuthB2CService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.register(registerDto, undefined);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'User created successfully',
      });
      expect(mockAuthB2CService.register).toHaveBeenCalledWith(registerDto);
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
        type: UserType.USER,
      };

      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;

      mockAuthB2CService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.register(registerDto, mockFile);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'User created successfully',
      });
      expect(mockAuthB2CService.register).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password',
      };

      mockAuthB2CService.login.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'Token created successfully',
      });
      expect(mockAuthB2CService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email availability', async () => {
      const verifyMailDto = { email: 'test@test.com' };

      mockAuthB2CService.verifyEmail.mockResolvedValue(true);

      const result = await controller.verifyEmail(verifyMailDto);

      expect(result).toEqual({
        data: { isAvailable: true },
        message: 'Email is available',
      });
      expect(mockAuthB2CService.verifyEmail).toHaveBeenCalledWith(verifyMailDto);
    });
  });

  describe('verifyToken', () => {
    it('should verify token', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthB2CService.verifyToken.mockResolvedValue(true);

      const result = await controller.verifyToken(mockRequest as any);

      expect(result).toEqual({
        data: { isValid: true },
        message: 'token is valid',
      });
      expect(mockAuthB2CService.verifyToken).toHaveBeenCalledWith('1');
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify email code', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const dto: VerifyEmailCodeDto = { code: '123456' };

      mockAuthB2CService.verifyEmailCode.mockResolvedValue(undefined);

      const result = await controller.verifyEmailCode(mockRequest as any, dto);

      expect(result).toEqual({
        message: 'Email verified successfully',
      });
      expect(mockAuthB2CService.verifyEmailCode).toHaveBeenCalledWith('1', '123456');
    });
  });

  describe('resendVerificationCode', () => {
    it('should resend verification code', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthB2CService.resendVerificationCode.mockResolvedValue(undefined);

      const result = await controller.resendVerificationCode(mockRequest as any);

      expect(result).toEqual({
        message: 'Verification code resent successfully',
      });
      expect(mockAuthB2CService.resendVerificationCode).toHaveBeenCalledWith('1');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      mockAuthB2CService.refreshToken.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual({
        data: { accessToken: 'new_access_token', refreshToken: 'new_refresh_token' },
        message: 'Tokens refreshed successfully',
      });
      expect(mockAuthB2CService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });
  });

  describe('logout', () => {
    it('should logout from current device', async () => {
      const mockRequest = {
        user: { uid: '1', deviceUid: 'device123' },
      };

      mockAuthB2CService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest as any);

      expect(result).toEqual({
        message: 'Logged out successfully',
      });
      expect(mockAuthB2CService.logout).toHaveBeenCalledWith('1', 'device123');
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockAuthB2CService.logoutAllDevices.mockResolvedValue(undefined);

      const result = await controller.logoutAllDevices(mockRequest as any);

      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
      expect(mockAuthB2CService.logoutAllDevices).toHaveBeenCalledWith('1');
    });
  });

  describe('generateAccessTokenFromCode', () => {
    it('should generate access token from valid code', async () => {
      const dto = { code: '123456' };
      const mockAccessToken = 'mock_generated_access_token';

      mockAuthB2CService.generateAccessTokenFromCode.mockResolvedValue(mockAccessToken);

      const result = await controller.generateAccessTokenFromCode(dto);

      expect(result).toEqual({
        accessToken: mockAccessToken,
      });
      expect(mockAuthB2CService.generateAccessTokenFromCode).toHaveBeenCalledWith('123456');
    });

    it('should handle errors from service when generating access token', async () => {
      const dto = { code: 'invalid-code' };

      mockAuthB2CService.generateAccessTokenFromCode.mockRejectedValue(
        new Error('Invalid or expired verification code'),
      );

      await expect(controller.generateAccessTokenFromCode(dto)).rejects.toThrow(
        'Invalid or expired verification code',
      );
      expect(mockAuthB2CService.generateAccessTokenFromCode).toHaveBeenCalledWith('invalid-code');
    });
  });
});

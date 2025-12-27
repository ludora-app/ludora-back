import { Test, TestingModule } from '@nestjs/testing';
import { Provider, Sex, UserType } from 'generated/prisma/client';
import { AuthB2CController } from 'src/auth/controllers/auth-b2c.controller';

import { VerifyEmailGuard } from 'src/auth/guards/verify-email.guard';
import { VerifyEmailCodeDto } from 'src/auth/dto/input/verify-email-code.dto';
import { CreateGoogleUserDto } from 'src/auth/dto/input/create-google-user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthB2CService } from 'src/auth/services/auth-b2c.service';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';

describe('AuthB2CController', () => {
  let controller: AuthB2CController;

  const mockAuthB2CService = {
    login: jest.fn(),
    register: jest.fn(),
    resendVerificationCode: jest.fn(),
    verifyEmail: jest.fn(),
    verifyEmailCode: jest.fn(),
    verifyEmailLink: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
    generateAccessTokenFromCode: jest.fn(),
    createOrConnectGoogleUser: jest.fn(),
    resetForgottenPassword: jest.fn(),
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
      .overrideGuard(VerifyEmailGuard)
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
        birthdate: new Date().toISOString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'Password123!',
        phone: '+33612345678',
        sex: Sex.MALE,
        type: UserType.USER,
      };

      mockAuthB2CService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        data: { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' },
        message: 'User created successfully',
      });
      expect(mockAuthB2CService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should register a new user with file', async () => {
      async function* parts() {
        yield { type: 'field', fieldname: 'type', value: UserType.USER };
        yield { type: 'field', fieldname: 'email', value: 'test@test.com' };
        yield { type: 'field', fieldname: 'password', value: 'Password123!' };
        yield { type: 'field', fieldname: 'firstname', value: 'John' };
        yield { type: 'field', fieldname: 'lastname', value: 'Doe' };
        yield { type: 'field', fieldname: 'birthdate', value: new Date().toISOString() };
        yield { type: 'field', fieldname: 'sex', value: Sex.MALE };
        yield { type: 'field', fieldname: 'bio', value: 'Test bio' };
        yield { type: 'field', fieldname: 'phone', value: '+33612345678' };
        yield {
          type: 'file',
          filename: 'test.jpg',
          toBuffer: async () => Buffer.from('test'),
        };
      }

      mockAuthB2CService.register.mockResolvedValue({
        accessToken: 'mock_token',
        refreshToken: 'mock_refresh_token',
      });

      const request = {
        isMultipart: () => true,
        parts: () => parts(),
      };

      const result = await controller.register(request as any);

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

      mockAuthB2CService.verifyEmailLink.mockResolvedValue(undefined);

      const result = await controller.verifyEmailCode(mockRequest as any);

      expect(result).toEqual({
        message: 'Email verified successfully',
      });
      expect(mockAuthB2CService.verifyEmailLink).toHaveBeenCalledWith({ uid: '1' });
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
      const dto = { code: '123456', email: 'test@test.com' };
      const mockAccessToken = 'mock_generated_access_token';

      mockAuthB2CService.generateAccessTokenFromCode.mockResolvedValue(mockAccessToken);

      const result = await controller.generateAccessTokenFromCode(dto);

      expect(result).toEqual({
        resetToken: mockAccessToken,
      });
      expect(mockAuthB2CService.generateAccessTokenFromCode).toHaveBeenCalledWith(
        '123456',
        'test@test.com',
      );
    });

    it('should handle errors from service when generating access token', async () => {
      const dto = { code: 'invalid-code', email: 'test@test.com' };

      mockAuthB2CService.generateAccessTokenFromCode.mockRejectedValue(
        new UnauthorizedException('Invalid verification code'),
      );

      await expect(controller.generateAccessTokenFromCode(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.generateAccessTokenFromCode(dto)).rejects.toThrow(
        'Invalid verification code',
      );
      expect(mockAuthB2CService.generateAccessTokenFromCode).toHaveBeenCalledWith(
        'invalid-code',
        'test@test.com',
      );
    });
  });

  describe('createOrConnectGoogleUser', () => {
    it('should create or connect a Google user successfully', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'google@test.com',
        firstname: 'John',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'Doe',
        provider: Provider.GOOGLE,
      };

      const mockServiceResponse = {
        accessToken: 'mock_access_token',
        message: 'User already exists, successfully connected to Google account',
        refreshToken: 'mock_refresh_token',
      };

      mockAuthB2CService.createOrConnectGoogleUser.mockResolvedValue(mockServiceResponse);

      const result = await controller.createOrConnectGoogleUser(createGoogleUserDto);

      expect(result).toEqual({
        data: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
        message: 'User already exists, successfully connected to Google account',
      });
      expect(mockAuthB2CService.createOrConnectGoogleUser).toHaveBeenCalledWith({
        ...createGoogleUserDto,
        provider: Provider.GOOGLE,
      });
    });

    it('should create a new Google user successfully', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'newgoogle@test.com',
        firstname: 'Jane',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'Smith',
        provider: Provider.GOOGLE,
      };

      const mockServiceResponse = {
        accessToken: 'mock_access_token',
        message: 'New user created and connected to Google account',
        refreshToken: 'mock_refresh_token',
      };

      mockAuthB2CService.createOrConnectGoogleUser.mockResolvedValue(mockServiceResponse);

      const result = await controller.createOrConnectGoogleUser(createGoogleUserDto);

      expect(result).toEqual({
        data: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
        message: 'New user created and connected to Google account',
      });
      expect(mockAuthB2CService.createOrConnectGoogleUser).toHaveBeenCalledWith({
        ...createGoogleUserDto,
        provider: Provider.GOOGLE,
      });
    });

    it('should handle errors from service when creating or connecting Google user', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'error@test.com',
        firstname: 'Error',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'User',
        provider: Provider.GOOGLE,
      };

      mockAuthB2CService.createOrConnectGoogleUser.mockRejectedValue(
        new Error('Error creating or connecting Google user'),
      );

      await expect(controller.createOrConnectGoogleUser(createGoogleUserDto)).rejects.toThrow(
        'Error creating or connecting Google user',
      );
      expect(mockAuthB2CService.createOrConnectGoogleUser).toHaveBeenCalled();
    });
  });

  describe('passwordReset', () => {
    it('should reset password successfully', async () => {
      const mockRequest = {
        user: { uid: 'user-1' },
      };
      const dto = {
        newPassword: 'newSecurePassword123!',
      };

      mockAuthB2CService.resetForgottenPassword.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result = await controller.passwordReset(dto, mockRequest as any);

      expect(result).toEqual({
        data: {
          accessToken: 'new_access_token',
          refreshToken: 'new_refresh_token',
        },
        message: 'Password reset successfully',
      });
      expect(mockAuthB2CService.resetForgottenPassword).toHaveBeenCalledWith(
        'newSecurePassword123!',
        'user-1',
      );
    });

    it('should handle NotFoundException when user not found', async () => {
      const mockRequest = {
        user: { uid: 'non-existent-user' },
      };
      const dto = {
        newPassword: 'newPassword123!',
      };

      mockAuthB2CService.resetForgottenPassword.mockRejectedValue(new Error('User not found'));

      await expect(controller.passwordReset(dto, mockRequest as any)).rejects.toThrow(
        'User not found',
      );
      expect(mockAuthB2CService.resetForgottenPassword).toHaveBeenCalledWith(
        'newPassword123!',
        'non-existent-user',
      );
    });

    it('should handle transaction errors during password reset', async () => {
      const mockRequest = {
        user: { uid: 'user-1' },
      };
      const dto = {
        newPassword: 'newPassword123!',
      };

      mockAuthB2CService.resetForgottenPassword.mockRejectedValue(new Error('Transaction failed'));

      await expect(controller.passwordReset(dto, mockRequest as any)).rejects.toThrow(
        'Transaction failed',
      );
      expect(mockAuthB2CService.resetForgottenPassword).toHaveBeenCalledWith(
        'newPassword123!',
        'user-1',
      );
    });

    it('should return new tokens after successful password reset', async () => {
      const mockRequest = {
        user: { uid: 'user-123' },
      };
      const dto = {
        newPassword: 'SuperSecure@2024!',
      };
      const expectedTokens = {
        accessToken: 'jwt_access_token_xyz',
        refreshToken: 'jwt_refresh_token_abc',
      };

      mockAuthB2CService.resetForgottenPassword.mockResolvedValue(expectedTokens);

      const result = await controller.passwordReset(dto, mockRequest as any);

      expect(result.data.accessToken).toBe('jwt_access_token_xyz');
      expect(result.data.refreshToken).toBe('jwt_refresh_token_abc');
      expect(result.message).toBe('Password reset successfully');
      expect(mockAuthB2CService.resetForgottenPassword).toHaveBeenCalledTimes(1);
    });
  });
});

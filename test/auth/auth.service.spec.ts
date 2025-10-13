import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Sex, User_type } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from 'src/auth/auth.service';
import { RefreshTokenDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    $transaction: jest.fn().mockImplementation((callback) => {
      if (typeof callback === 'function') {
        return callback({
          emailVerification: {
            create: jest.fn().mockResolvedValue({ uid: '1', code: '123456' }),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          userTokens: {
            create: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
            update: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
            delete: jest.fn().mockResolvedValue({ uid: '1' }),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
          },
          refreshTokens: {
            create: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
            update: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
            delete: jest.fn().mockResolvedValue({ uid: '1' }),
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            findMany: jest.fn().mockResolvedValue([]),
            findFirst: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
          },
        });
      }
      return Promise.all(callback);
    }),
    users: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ uid: '1', emailVerified: true }),
    },
    userTokens: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
      update: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
      delete: jest.fn().mockResolvedValue({ uid: '1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_token' }),
    },
    refreshTokens: {
      create: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
      update: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
      delete: jest.fn().mockResolvedValue({ uid: '1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ uid: '1', token: 'mock_refresh_token' }),
    },
    emailVerification: {
      create: jest.fn().mockResolvedValue({ uid: '1', code: '123456' }),
      delete: jest.fn().mockResolvedValue({ uid: '1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
    verifyAsync: jest.fn().mockResolvedValue({ uid: '1', deviceUid: 'device123' }),
  };

  const mockUsersService = {
    createUser: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailsService,
          useValue: mockEmailsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    module.get<PrismaService>(PrismaService);
    module.get<JwtService>(JwtService);
    module.get<UsersService>(UsersService);
    module.get<EmailsService>(EmailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        bio: 'test bio',
        birthdate: new Date().toString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'password',
        phone: '1234567890',
        sex: Sex.MALE,
        type: User_type.USER,
      };

      const mockUser = {
        uid: '1',
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        ...registerDto,
      };

      mockUsersService.createUser.mockResolvedValue(mockUser);

      jest.spyOn(service, 'sendVerificationEmail').mockResolvedValue();

      const result = await service.register(registerDto);

      expect(result).toEqual({ accessToken: 'mock_token', refreshToken: 'mock_token' });
      expect(mockUsersService.createUser).toHaveBeenCalled();
      expect(service.sendVerificationEmail).toHaveBeenCalledWith('1', 'test@test.com');
    });

    it('should throw BadRequestException for invalid user type', async () => {
      const registerDto = {
        email: 'test@test.com',
        password: 'password',
        type: 'INVALID_TYPE' as User_type,
      };

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password',
      };

      const hashedPassword = await argon2.hash('password');
      const mockUser = {
        email: loginDto.email,
        uid: '1',
        password: hashedPassword,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({ accessToken: 'mock_token', refreshToken: 'mock_token' });
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should return true when email is available', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.verifyEmail({ email: 'new@test.com' });

      expect(result).toBe(true);
    });

    it('should return false when email is already used', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue({ uid: '1' });

      const result = await service.verifyEmail({ email: 'existing@test.com' });

      expect(result).toBe(false);
    });
  });

  describe('verifyToken', () => {
    it('should return isValid=true for a valid user', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        isConnected: true,
      });

      const result = await service.verifyToken('1');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.verifyToken('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when user is not active', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        isConnected: false,
      });

      await expect(service.verifyToken('1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email successfully', async () => {
      await service.sendVerificationEmail('1', 'test@test.com');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { code: expect.any(String) },
        recipients: ['test@test.com'],
        template: 'verificationCode',
      });
    });
  });

  describe('verifyEmailCode', () => {
    it('should verify email code successfully', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60000); // 1 minute in the future

      mockPrismaService.emailVerification.findFirst.mockResolvedValue({
        uid: '1',
        code: '123456',
        expiresAt: futureDate,
        userUid: '1',
      });

      const result = await service.verifyEmailCode('1', '123456');

      expect(result).toBeUndefined();
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        data: { emailVerified: true },
        where: { uid: '1' },
      });
    });

    it('should throw BadRequestException for invalid or expired code', async () => {
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmailCode('1', '123456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationCode', () => {
    it('should resend verification code', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        email: 'test@test.com',
        emailVerified: false,
      });

      jest.spyOn(service, 'sendVerificationEmail').mockResolvedValue();

      const result = await service.resendVerificationCode('1');

      expect(result).toBeUndefined();
      expect(service.sendVerificationEmail).toHaveBeenCalledWith('1', 'test@test.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.resendVerificationCode('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email is already verified', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        email: 'test@test.com',
        emailVerified: true,
      });

      await expect(service.resendVerificationCode('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto: RefreshTokenDto = { refreshToken: 'valid_refresh_token' };

      mockPrismaService.refreshTokens.findFirst.mockResolvedValue({
        uid: '1',
        token: 'valid_refresh_token',
        userUid: '1',
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        isConnected: true,
        emailVerified: true,
      });

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({ accessToken: 'mock_token', refreshToken: 'mock_token' });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = { refreshToken: 'invalid_token' };

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const refreshTokenDto: RefreshTokenDto = { refreshToken: 'expired_token' };

      mockJwtService.verifyAsync.mockResolvedValue({ uid: '1' });
      mockPrismaService.refreshTokens.findFirst.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout from current device', async () => {
      await service.logout('1', 'device123');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should logout from all devices', async () => {
      await service.logout('1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      await service.logoutAllDevices('1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});

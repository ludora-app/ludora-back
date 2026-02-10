import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Provider, Sex, UserType } from 'generated/prisma/client';
import * as argon2 from 'argon2';
import { PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RefreshTokenDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { UsersService } from 'src/users/users.service';
import { CreateGoogleUserDto } from 'src/auth/dto/input/create-google-user.dto';
import { DateUtils } from 'src/shared/utils/date.utils';
import { USERSELECT } from 'src/shared/constants/select-user';
import { AuthB2CService } from 'src/auth/services/auth-b2c.service';

describe('AuthB2CService', () => {
  let service: AuthB2CService;

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
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ uid: '1', isEmailVerified: true }),
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
    create: jest.fn(),
    createUser: jest.fn(),
    findOneByEmail: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEmailsService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:2424'),
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    emitAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthB2CService,
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuthB2CService>(AuthB2CService);
    module.get<PrismaService>(PrismaService);
    module.get<JwtService>(JwtService);
    module.get<UsersService>(UsersService);
    module.get<EmailsService>(EmailsService);
    module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Create a birthdate that makes the user at least 15 years old
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 20); // 20 years ago

      const registerDto = {
        bio: 'test bio',
        birthdate: birthdate.toISOString(),
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'password',
        phone: '1234567890',
        sex: Sex.MALE,
        type: UserType.USER,
      };

      const mockUser = {
        uid: '1',
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
        ...registerDto,
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      jest.spyOn(service, 'sendVerificationEmail').mockResolvedValue();

      const result = await service.register(registerDto);

      expect(result).toEqual({ accessToken: 'mock_token', refreshToken: 'mock_token' });
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(service.sendVerificationEmail).toHaveBeenCalledWith('1', 'test@test.com');
    });

    it('should throw BadRequestException for invalid user type', async () => {
      const registerDto = {
        email: 'test@test.com',
        password: 'password',
        type: 'INVALID_TYPE' as UserType,
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
        data: { link: expect.any(String) },
        recipients: ['test@test.com'],
        template: 'verificationLink',
      });
    });
  });

  describe('resendVerificationCode', () => {
    it('should resend verification code', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        email: 'test@test.com',
        isEmailVerified: false,
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
        isEmailVerified: true,
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
        expiresAt: new Date(Date.now() + DateUtils.FIFTEEN_MINUTES),
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: '1',
        isConnected: true,
        isEmailVerified: true,
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
    it('should logout user by invalidating all tokens', async () => {
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

  describe('generateAccessTokenFromCode', () => {
    it('should generate access token from valid code', async () => {
      const mockCode = '123456';
      const mockEmail = 'test@test.com';
      const mockVerificationCode = {
        uid: 'verification-uid-1',
        code: mockCode,
        userUid: 'user-1',
        expiresAt: new Date(Date.now() + DateUtils.FIFTEEN_MINUTES),
      };
      const mockUser = {
        uid: 'user-1',
        email: mockEmail,
        firstname: 'John',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(mockVerificationCode);
      mockPrismaService.userTokens.create.mockResolvedValue({
        uid: 'token-uid-1',
        token: 'mock_access_token',
        userUid: 'user-1',
      });

      const result = await service.generateAccessTokenFromCode(mockCode, mockEmail);

      expect(result).toBe('mock_token');
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        mockEmail.toLowerCase(),
        USERSELECT.findOneByEmail,
      );
      expect(mockPrismaService.emailVerification.findFirst).toHaveBeenCalledWith({
        where: { code: mockCode, userUid: 'user-1' },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { uid: 'user-1', type: 'access' },
        { expiresIn: expect.any(String) },
      );
      expect(mockPrismaService.userTokens.create).toHaveBeenCalledWith({
        data: {
          token: 'mock_token',
          userUid: 'user-1',
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockCode = 'invalid-code';
      const mockEmail = 'test@test.com';

      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        'User test@test.com not found',
      );
      expect(mockPrismaService.emailVerification.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.userTokens.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if verification code is invalid', async () => {
      const mockCode = 'invalid-code';
      const mockEmail = 'test@test.com';
      const mockUser = {
        uid: 'user-1',
        email: mockEmail,
        firstname: 'John',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(null);

      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        'Invalid verification code',
      );
      expect(mockPrismaService.userTokens.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if verification code is expired', async () => {
      const mockCode = '123456';
      const mockEmail = 'test@test.com';
      const mockUser = {
        uid: 'user-1',
        email: mockEmail,
        firstname: 'John',
      };
      const mockVerificationCode = {
        uid: 'verification-uid-1',
        code: mockCode,
        userUid: 'user-1',
        expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes in the past
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(mockVerificationCode);

      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.generateAccessTokenFromCode(mockCode, mockEmail)).rejects.toThrow(
        'Expired verification code',
      );
      expect(mockPrismaService.userTokens.create).not.toHaveBeenCalled();
    });
  });

  describe('createOrConnectGoogleUser', () => {
    it('should connect existing user with Google account', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'existing@test.com',
        firstname: 'John',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'Doe',
        provider: Provider.GOOGLE,
      };

      const existingUser = {
        uid: 'existing-user-1',
        email: 'existing@test.com',
        firstname: 'John',
        lastname: 'Doe',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(existingUser);
      mockPrismaService.userTokens.create.mockResolvedValue({
        uid: 'token-1',
        token: 'mock_token',
        userUid: existingUser.uid,
      });
      mockPrismaService.refreshTokens.create.mockResolvedValue({
        uid: 'refresh-token-1',
        token: 'mock_refresh_token',
        userUid: existingUser.uid,
      });

      const result = await service.createOrConnectGoogleUser(createGoogleUserDto);

      expect(result).toEqual({
        accessToken: 'mock_token',
        isNewUser: false,
        message: 'User already exists, successfully connected to Google account',
        refreshToken: 'mock_token',
      });
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'existing@test.com',
        USERSELECT.findOneByEmail,
      );
      expect(mockPrismaService.userTokens.create).toHaveBeenCalledWith({
        data: {
          token: 'mock_token',
          userUid: existingUser.uid,
        },
      });
      expect(mockPrismaService.refreshTokens.create).toHaveBeenCalledWith({
        data: {
          expiresAt: expect.any(Date),
          token: 'mock_token',
          userUid: existingUser.uid,
        },
      });
    });

    it('should create new user with Google account', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'new@test.com',
        firstname: 'Jane',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'Smith',
        provider: Provider.GOOGLE,
      };

      const newUser = {
        uid: 'new-user-1',
        email: 'new@test.com',
        firstname: 'Jane',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'Smith',
        provider: Provider.GOOGLE,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(newUser);
      mockPrismaService.userTokens.create.mockResolvedValue({
        uid: 'token-1',
        token: 'mock_token',
        userUid: newUser.uid,
      });
      mockPrismaService.refreshTokens.create.mockResolvedValue({
        uid: 'refresh-token-1',
        token: 'mock_refresh_token',
        userUid: newUser.uid,
      });

      const result = await service.createOrConnectGoogleUser(createGoogleUserDto);

      expect(result).toEqual({
        accessToken: 'mock_token',
        isNewUser: true,
        message: 'New user created and connected to Google account',
        refreshToken: 'mock_token',
      });
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'new@test.com',
        USERSELECT.findOneByEmail,
      );
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: {
          email: createGoogleUserDto.email,
          isEmailVerified: true,
          firstname: createGoogleUserDto.firstname,
          imageUrl: createGoogleUserDto.imageUrl,
          lastname: createGoogleUserDto.lastname,
          provider: createGoogleUserDto.provider,
        },
      });
      expect(mockPrismaService.userTokens.create).toHaveBeenCalled();
      expect(mockPrismaService.refreshTokens.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      const createGoogleUserDto: CreateGoogleUserDto = {
        email: 'error@test.com',
        firstname: 'Error',
        imageUrl: 'https://example.com/photo.jpg',
        lastname: 'User',
        provider: Provider.GOOGLE,
      };

      mockUsersService.findOneByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.createOrConnectGoogleUser(createGoogleUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrConnectGoogleUser(createGoogleUserDto)).rejects.toThrow(
        'Error creating or connecting Google user: Database error',
      );
    });
  });

  describe('resetForgottenPassword', () => {
    it('should reset forgotten password successfully', async () => {
      const mockUser = {
        uid: 'user-1',
        email: 'test@test.com',
        firstname: 'John',
        password: 'oldHashedPassword',
      };

      const hashedPassword = await argon2.hash('newPassword123');

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          users: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue({ ...mockUser, password: hashedPassword }),
          },
          userTokens: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({
              uid: 'token-1',
              token: 'mock_access_token',
              userUid: mockUser.uid,
            }),
          },
          refreshTokens: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockResolvedValue({
              uid: 'refresh-token-1',
              token: 'mock_refresh_token',
              userUid: mockUser.uid,
            }),
          },
        });
      });

      const result = await service.resetForgottenPassword('newPassword123', 'user-1');

      expect(result).toEqual({
        accessToken: 'mock_token',
        refreshToken: 'mock_token',
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEmailsService.sendEmail).toHaveBeenCalledWith({
        data: { name: 'John' },
        recipients: ['test@test.com'],
        template: 'passwordReset',
      });
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        'User test@test.com password has been reset successfully',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          users: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(
        service.resetForgottenPassword('newPassword123', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.resetForgottenPassword('newPassword123', 'non-existent'),
      ).rejects.toThrow('User not found');
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockUser = {
        uid: 'user-1',
        email: 'test@test.com',
        firstname: 'John',
        password: 'oldHashedPassword',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          users: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
          },
          userTokens: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            create: jest.fn().mockRejectedValue(new Error('Token creation failed')),
          },
          refreshTokens: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        });
      });

      await expect(service.resetForgottenPassword('newPassword123', 'user-1')).rejects.toThrow(
        'Token creation failed',
      );
      expect(mockEmailsService.sendEmail).not.toHaveBeenCalled();
    });

    it('should delete all existing tokens before creating new ones', async () => {
      const mockUser = {
        uid: 'user-1',
        email: 'test@test.com',
        firstname: 'John',
        password: 'oldHashedPassword',
      };

      const mockTxUserTokens = {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn().mockResolvedValue({
          uid: 'token-1',
          token: 'mock_access_token',
          userUid: mockUser.uid,
        }),
      };

      const mockTxRefreshTokens = {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        create: jest.fn().mockResolvedValue({
          uid: 'refresh-token-1',
          token: 'mock_refresh_token',
          userUid: mockUser.uid,
        }),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          users: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
          },
          userTokens: mockTxUserTokens,
          refreshTokens: mockTxRefreshTokens,
        });
      });

      await service.resetForgottenPassword('newPassword123', 'user-1');

      expect(mockTxUserTokens.deleteMany).toHaveBeenCalledWith({
        where: { userUid: 'user-1' },
      });
      expect(mockTxRefreshTokens.deleteMany).toHaveBeenCalledWith({
        where: { userUid: 'user-1' },
      });
      expect(mockTxUserTokens.create).toHaveBeenCalled();
      expect(mockTxRefreshTokens.create).toHaveBeenCalled();
    });
  });
});

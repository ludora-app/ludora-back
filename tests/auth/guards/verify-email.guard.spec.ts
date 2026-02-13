import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { VerifyEmailGuard } from 'src/auth/guards/verify-email.guard';
import { USERSELECT } from 'src/shared/constants/select-user';

describe('VerifyEmailGuard', () => {
  let guard: VerifyEmailGuard;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let usersService: UsersService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockPrismaService = {
    emailVerification: {
      findFirst: jest.fn(),
    },
  };

  const createMockExecutionContext = (query: { token?: string } = {}) => {
    const request = { query };
    return {
      context: {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => request,
        }),
      } as unknown as ExecutionContext,
      request,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    guard = module.get<VerifyEmailGuard>(VerifyEmailGuard);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when token is missing', async () => {
      const { context } = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid (JWT verification fails)', async () => {
      const { context } = createMockExecutionContext({ token: 'invalid-jwt' });

      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
    });

    it('should throw UnauthorizedException when payload is missing email', async () => {
      const { context } = createMockExecutionContext({ token: 'valid-jwt' });

      mockJwtService.verifyAsync.mockResolvedValue({ code: '123456' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when payload is missing code', async () => {
      const { context } = createMockExecutionContext({ token: 'valid-jwt' });

      mockJwtService.verifyAsync.mockResolvedValue({ email: 'user@example.com' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const { context } = createMockExecutionContext({ token: 'valid-jwt' });

      mockJwtService.verifyAsync.mockResolvedValue({
        email: 'unknown@example.com',
        code: '123456',
      });
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'unknown@example.com',
        USERSELECT.findOneByEmail,
      );
    });

    it('should throw UnauthorizedException when verification is not found or expired', async () => {
      const { context } = createMockExecutionContext({ token: 'valid-jwt' });

      mockJwtService.verifyAsync.mockResolvedValue({
        email: 'user@example.com',
        code: '123456',
      });
      mockUsersService.findOneByEmail.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
      });
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.emailVerification.findFirst).toHaveBeenCalledWith({
        where: {
          code: '123456',
          expiresAt: { gt: expect.any(Date) },
          userUid: 'user-123',
        },
      });
    });

    it('should return true and attach verificationCode and user to request when valid', async () => {
      const { context, request } = createMockExecutionContext({ token: 'valid-jwt' });

      const mockUser = {
        uid: 'user-123',
        email: 'user@example.com',
        firstname: 'John',
        lastname: 'Doe',
      };
      const mockVerification = {
        code: '123456',
        userUid: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        email: 'user@example.com',
        code: '123456',
      });
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockPrismaService.emailVerification.findFirst.mockResolvedValue(mockVerification);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request).toHaveProperty('verificationCode', '123456');
      expect(request).toHaveProperty('user', mockUser);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt');
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        'user@example.com',
        USERSELECT.findOneByEmail,
      );
      expect(mockPrismaService.emailVerification.findFirst).toHaveBeenCalledWith({
        where: {
          code: '123456',
          expiresAt: { gt: expect.any(Date) },
          userUid: 'user-123',
        },
      });
    });
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  let logger: PinoLogger;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  const mockPrismaService = {
    userTokens: {
      findFirst: jest.fn(),
    },
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    logger = module.get<PinoLogger>(PinoLogger);

    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'ADMIN_1_EMAIL') return 'admin1@test.com';
      if (key === 'ADMIN_2_EMAIL') return 'admin2@test.com';
      return null;
    });
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(logger.setContext).toHaveBeenCalledWith('AdminGuard');
  });

  const createMockContext = (headers: any = {}): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers }),
      }),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('should throw UnauthorizedException if token is missing', async () => {
      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should throw UnauthorizedException if header does not have Bearer', async () => {
      const context = createMockContext({ authorization: 'Basic token123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should throw UnauthorizedException if token is invalid (jwt verification fails)', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Access denied'),
      );
      expect(logger.error).toHaveBeenCalledWith('Invalid token');
    });

    it('should throw UnauthorizedException if uid is missing in payload', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockResolvedValue({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalid: user missing'),
      );
    });

    it('should throw UnauthorizedException if token record is not found in database', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user-uid' });
      mockPrismaService.userTokens.findFirst.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token expired or invalid'),
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user-uid' });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({ token: 'token123' });
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should throw UnauthorizedException if user is not an admin type', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user-uid' });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({ token: 'token123' });
      mockUsersService.findOne.mockResolvedValue({ type: UserType.USER, email: 'admin1@test.com' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User is not an admin'),
      );
    });

    it('should throw UnauthorizedException if user email is not in ADMIN_EMAILS', async () => {
      const context = createMockContext({ authorization: 'Bearer token123' });
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user-uid' });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({ token: 'token123' });
      mockUsersService.findOne.mockResolvedValue({
        type: UserType.ADMIN,
        email: 'hacker@test.com',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User is not an admin'),
      );
    });

    it('should return true and attach user to request if admin is valid', async () => {
      const requestMock: any = { headers: { authorization: 'Bearer token123' } };
      const context = createMockContext(requestMock.headers);
      jest.spyOn(context.switchToHttp(), 'getRequest').mockReturnValue(requestMock);

      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user-uid', iat: 1234 });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({ token: 'token123' });
      mockUsersService.findOne.mockResolvedValue({
        type: UserType.ADMIN,
        email: 'admin2@test.com',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(requestMock['user']).toEqual({
        uid: 'user-uid',
        iat: 1234,
        email: 'admin2@test.com',
        userType: UserType.ADMIN,
      });
    });
  });
});

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;
  let prismaService: PrismaService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockPrismaService = {
    user_tokens: {
      findFirst: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const createMockExecutionContext = () => {
    const mockGetRequest = jest.fn();

    return {
      context: {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: mockGetRequest,
        }),
      } as unknown as ExecutionContext,
      mockGetRequest,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const { context } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {},
      };
      mockGetRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should throw UnauthorizedException when authorization header is malformed', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Access denied'),
      );
    });

    it('should throw UnauthorizedException when token payload is missing uid', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalid: user missing'),
      );
    });

    it('should throw UnauthorizedException when token is not found in database', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user123' });
      mockPrismaService.user_tokens.findFirst.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token expired or invalid'),
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user123' });
      mockPrismaService.user_tokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
      });
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });

    it('should throw UnauthorizedException when user account is disabled', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user123' });
      mockPrismaService.user_tokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
      });
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user123',
        emailVerified: true,
        isConnected: false,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User account disabled'),
      );
    });

    it('should return true and attach user to request when token is valid', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);

      const mockPayload = { uid: 'user123', deviceUid: 'device456' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      mockPrismaService.user_tokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user123',
        emailVerified: true,
        isConnected: true,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid_token');
      expect(mockPrismaService.user_tokens.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid_token',
          userUid: 'user123',
        },
      });
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        select: { emailVerified: true, uid: true, isConnected: true },
        where: { uid: 'user123' },
      });
    });

    it('should handle different token types correctly (only Bearer)', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Basic sometoken',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should log errors when authentication fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '🔒 Auth Guard Error:',
        expect.objectContaining({
          message: 'Token expired',
          timestamp: expect.any(String),
          token: expect.stringContaining('invalid_token'),
        }),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing authorization header', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {},
      };
      mockGetRequest.mockReturnValue(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token missing'),
      );
    });

    it('should verify token with correct userUid from payload', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);

      const mockPayload = { uid: 'user789' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      mockPrismaService.user_tokens.findFirst.mockResolvedValue({
        uid: 'token789',
        token: 'valid_token',
        userUid: 'user789',
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user789',
        emailVerified: true,
        isConnected: true,
      });

      await guard.canActivate(context);

      expect(mockPrismaService.user_tokens.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid_token',
          userUid: 'user789',
        },
      });
    });
  });
});

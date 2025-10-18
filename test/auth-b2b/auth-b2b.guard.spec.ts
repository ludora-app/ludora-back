import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2BGuard } from '../../src/auth-b2b/guards/auth-b2b.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { PartnersService } from 'src/partners/partners.service';

describe('AuthB2BGuard', () => {
  let guard: AuthB2BGuard;
  let jwtService: JwtService;
  let reflector: Reflector;
  let prismaService: PrismaService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockPartnersService = {
    findOne: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockPrismaService = {
    userTokens: {
      findFirst: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
    partners: {
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
        AuthB2BGuard,
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
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PartnersService,
          useValue: mockPartnersService,
        },
      ],
    }).compile();

    guard = module.get<AuthB2BGuard>(AuthB2BGuard);
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
      mockJwtService.verifyAsync.mockResolvedValue({ organisationUid: 'org123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalid: user or organisation missing'),
      );
    });

    it('should throw UnauthorizedException when token payload is missing organisationUid', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ uid: 'user123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalid: user or organisation missing'),
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
      mockJwtService.verifyAsync.mockResolvedValue({
        uid: 'user123',
        organisationUid: 'org123',
      });
      mockPrismaService.userTokens.findFirst.mockResolvedValue(null);

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
      mockJwtService.verifyAsync.mockResolvedValue({
        uid: 'user123',
        organisationUid: 'org123',
      });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
        organisationUid: 'org123',
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
      mockJwtService.verifyAsync.mockResolvedValue({
        uid: 'user123',
        organisationUid: 'org123',
      });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
        organisationUid: 'org123',
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

    it('should throw UnauthorizedException when partner is not found', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({
        uid: 'user123',
        organisationUid: 'org123',
      });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
        organisationUid: 'org123',
      });
      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user123',
        emailVerified: true,
        isConnected: true,
      });
      mockPrismaService.partners.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Partner not found'),
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

      const mockPayload = {
        uid: 'user123',
        organisationUid: 'org123',
      };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token123',
        token: 'valid_token',
        userUid: 'user123',
        organisationUid: 'org123',
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user123',
        emailVerified: true,
        isConnected: true,
      });

      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: 'org123',
        name: 'Test Partner',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid_token');
      expect(mockPrismaService.userTokens.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid_token',
          userUid: 'user123',
          organisationUid: 'org123',
        },
      });
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        select: { emailVerified: true, uid: true, isConnected: true },
        where: { uid: 'user123' },
      });
      expect(mockPrismaService.partners.findUnique).toHaveBeenCalledWith({
        where: { uid: 'org123' },
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

    it('should verify token with correct userUid and organisationUid from payload', async () => {
      const { context, mockGetRequest } = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };
      mockGetRequest.mockReturnValue(mockRequest);

      const mockPayload = { uid: 'user789', organisationUid: 'org789' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token789',
        token: 'valid_token',
        userUid: 'user789',
        organisationUid: 'org789',
      });

      mockPrismaService.users.findUnique.mockResolvedValue({
        uid: 'user789',
        emailVerified: true,
        isConnected: true,
      });

      mockPrismaService.partners.findUnique.mockResolvedValue({
        uid: 'org789',
        name: 'Test Partner',
      });

      await guard.canActivate(context);

      expect(mockPrismaService.userTokens.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid_token',
          userUid: 'user789',
          organisationUid: 'org789',
        },
      });
      expect(mockPrismaService.partners.findUnique).toHaveBeenCalledWith({
        where: { uid: 'org789' },
      });
    });
  });
});

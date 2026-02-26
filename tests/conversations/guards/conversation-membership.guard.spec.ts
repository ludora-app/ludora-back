import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationMembershipGuard } from 'src/conversations/guards/conversation-membership.guard';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ConversationMembershipGuard', () => {
  let guard: ConversationMembershipGuard;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    conversationMembers: {
      findUnique: jest.fn(),
    },
  };

  const createMockExecutionContext = (request: {
    user?: { uid: string };
    params?: { uid?: string };
    query?: { uid?: string };
  }) => {
    const mockGetRequest = jest.fn().mockReturnValue(request);
    return {
      context: {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: mockGetRequest,
        }),
      } as unknown as ExecutionContext,
      request,
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationMembershipGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<ConversationMembershipGuard>(ConversationMembershipGuard);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when userUid is missing', async () => {
      const { context } = createMockExecutionContext({
        params: { uid: 'conv-123' },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.conversationMembers.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when conversationUid is missing (no params.uid nor query.uid)', async () => {
      const { context } = createMockExecutionContext({
        user: { uid: 'user-123' },
        params: {},
        query: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.conversationMembers.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not a member of the conversation', async () => {
      const request = {
        user: { uid: 'user-123' },
        params: { uid: 'conv-123' },
      };
      const { context } = createMockExecutionContext(request);

      mockPrismaService.conversationMembers.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('You are not a member of this conversation.'),
      );
      expect(mockPrismaService.conversationMembers.findUnique).toHaveBeenCalledWith({
        where: {
          conversationUid_userUid: { conversationUid: 'conv-123', userUid: 'user-123' },
        },
      });
    });

    it('should return true and attach membership to request when user is a member (uid from params)', async () => {
      const request = {
        user: { uid: 'user-123' },
        params: { uid: 'conv-123' },
      };
      const { context } = createMockExecutionContext(request);

      const mockMembership = {
        conversationUid: 'conv-123',
        userUid: 'user-123',
        uid: 'member-uid',
      };
      mockPrismaService.conversationMembers.findUnique.mockResolvedValue(mockMembership);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request).toHaveProperty('membership', mockMembership);
      expect(mockPrismaService.conversationMembers.findUnique).toHaveBeenCalledWith({
        where: {
          conversationUid_userUid: { conversationUid: 'conv-123', userUid: 'user-123' },
        },
      });
    });

    it('should use query.uid when params.uid is not set', async () => {
      const request = {
        user: { uid: 'user-456' },
        params: {},
        query: { uid: 'conv-456' },
      };
      const { context } = createMockExecutionContext(request);

      const mockMembership = {
        conversationUid: 'conv-456',
        userUid: 'user-456',
        uid: 'member-uid-2',
      };
      mockPrismaService.conversationMembers.findUnique.mockResolvedValue(mockMembership);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request).toHaveProperty('membership', mockMembership);
      expect(mockPrismaService.conversationMembers.findUnique).toHaveBeenCalledWith({
        where: {
          conversationUid_userUid: { conversationUid: 'conv-456', userUid: 'user-456' },
        },
      });
    });

    it('should prefer params.uid over query.uid', async () => {
      const request = {
        user: { uid: 'user-789' },
        params: { uid: 'conv-from-params' },
        query: { uid: 'conv-from-query' },
      };
      const { context } = createMockExecutionContext(request);

      mockPrismaService.conversationMembers.findUnique.mockResolvedValue({
        conversationUid: 'conv-from-params',
        userUid: 'user-789',
        uid: 'member-uid-3',
      });

      await guard.canActivate(context);

      expect(mockPrismaService.conversationMembers.findUnique).toHaveBeenCalledWith({
        where: {
          conversationUid_userUid: { conversationUid: 'conv-from-params', userUid: 'user-789' },
        },
      });
    });
  });
});

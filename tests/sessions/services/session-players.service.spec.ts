import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sessionPlayers: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    sessions: {
      findMany: jest.fn(),
    },
  };

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockConversationMembersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlayersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ConversationMembersService,
          useValue: mockConversationMembersService,
        },
      ],
    }).compile();

    service = module.get<SessionPlayersService>(SessionPlayersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPlayerToSession', () => {
    it('creates a player and logs info', async () => {
      const dto = {
        sessionUid: 'session-uid-123',
        teamUid: 'team-uid-456',
        userUid: 'user-uid-789',
      };

      const created = {
        uid: 'player-uid-101',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrismaService.sessionPlayers.create as jest.Mock).mockResolvedValue(created);

      const result = await service.addPlayerToSession(dto as any, dto.userUid);

      expect(prismaService.sessionPlayers.create).toHaveBeenCalledWith({
        data: dto,
        include: expect.any(Object),
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Player ${dto.userUid} added to session ${dto.sessionUid}`,
      );
      expect(result).toEqual(created);
    });
  });

  describe('findPlayersBySessionUid', () => {
    it('returns players for session uid', async () => {
      const players = [{ uid: 'p1' }, { uid: 'p2' }] as any[];
      (mockPrismaService.sessionPlayers.findMany as jest.Mock).mockResolvedValue(players);

      const result = await service.findPlayersBySessionUid('session-uid-123');

      expect(prismaService.sessionPlayers.findMany).toHaveBeenCalledWith({
        where: { sessionUid: 'session-uid-123' },
      });
      expect(result).toEqual(players);
    });
  });

  describe('findOne', () => {
    it('returns a player for session/user', async () => {
      const player = { uid: 'p1' } as any;
      (mockPrismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue(player);

      const result = await service.findOne('session-uid-123', 'user-uid-789');

      expect(prismaService.sessionPlayers.findFirst).toHaveBeenCalledWith({
        where: { sessionUid: 'session-uid-123', userUid: 'user-uid-789' },
      });
      expect(result).toEqual(player);
    });
  });

  describe('suggestPlayerFromPreviousSessions', () => {
    const userUid = 'user-uid-123';

    it('returns paginated suggestions from previous sessions', async () => {
      const suggestedUser = {
        uid: 'suggested-user-uid',
        firstname: 'Jean',
        lastname: 'Dupont',
        imageUrl: 'https://example.com/avatar.jpg',
      };
      const previousSessions = [
        {
          sessionPlayers: [{ user: suggestedUser }],
        },
      ];
      (mockPrismaService.sessions.findMany as jest.Mock).mockResolvedValue(previousSessions);

      const result = await service.suggestPlayerFromPreviousSessions(userUid);

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          where: {
            endDate: { gte: expect.any(Date) },
            sessionPlayers: { some: { userUid } },
          },
          select: expect.objectContaining({
            sessionPlayers: {
              select: {
                user: {
                  select: {
                    firstname: true,
                    imageUrl: true,
                    lastname: true,
                    uid: true,
                  },
                },
              },
            },
          }),
        }),
      );
      expect(result).toEqual({
        items: [suggestedUser],
        nextCursor: null,
        totalCount: 1,
      });
    });

    it('returns empty list when user has no previous sessions', async () => {
      (mockPrismaService.sessions.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggestPlayerFromPreviousSessions(userUid);

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });

    it('limits to 20 suggestions when more than 20 players are found', async () => {
      const users = Array.from({ length: 25 }, (_, i) => ({
        uid: `user-${i}`,
        firstname: `First${i}`,
        lastname: `Last${i}`,
        imageUrl: null,
      }));
      const previousSessions = [
        {
          sessionPlayers: users.map((user) => ({ user })),
        },
      ];
      (mockPrismaService.sessions.findMany as jest.Mock).mockResolvedValue(previousSessions);

      const result = await service.suggestPlayerFromPreviousSessions(userUid);

      expect(result.items).toHaveLength(20);
      expect(result.totalCount).toBe(20);
      expect(result.nextCursor).toBeNull();
    });

    it('aggregates players from multiple sessions', async () => {
      const user1 = { uid: 'u1', firstname: 'A', lastname: 'A', imageUrl: null };
      const user2 = { uid: 'u2', firstname: 'B', lastname: 'B', imageUrl: null };
      const previousSessions = [
        { sessionPlayers: [{ user: user1 }] },
        { sessionPlayers: [{ user: user2 }] },
      ];
      (mockPrismaService.sessions.findMany as jest.Mock).mockResolvedValue(previousSessions);

      const result = await service.suggestPlayerFromPreviousSessions(userUid);

      expect(result.items).toEqual([user1, user2]);
      expect(result.totalCount).toBe(2);
    });
  });
});

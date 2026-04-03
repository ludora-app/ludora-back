import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { RatingStatus } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sessionPlayers: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    sessionTeams: {
      findUnique: jest.fn(),
    },
    sessions: {
      findMany: jest.fn(),
    },
    conversations: {
      findFirst: jest.fn(),
    },
    conversationMembers: {
      delete: jest.fn(),
    },
    friends: {
      findFirst: jest.fn(),
    },
    userBlocks: {
      findFirst: jest.fn(),
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

  describe('leaveSession', () => {
    const sessionUid = 'session-uid-123';
    const userUid = 'user-uid-789';
    const conversationUid = 'conversation-uid-456';
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);

    const mockSession = {
      uid: sessionUid,
      startDate: futureDate,
      endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
    } as any;

    it('should delete player and conversation membership when session has not started', async () => {
      const mockPlayer = { sessionUid, userUid } as any;
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (mockPrismaService.sessionPlayers.delete as jest.Mock).mockResolvedValue(undefined);
      (mockPrismaService.conversations.findFirst as jest.Mock).mockResolvedValue({
        uid: conversationUid,
      });
      (mockPrismaService.conversationMembers.delete as jest.Mock).mockResolvedValue(undefined);

      await service.leaveSession(mockSession, userUid);

      expect(mockPrismaService.sessionPlayers.findUnique).toHaveBeenCalledWith({
        where: { sessionUid_userUid: { sessionUid, userUid } },
      });
      expect(mockPrismaService.sessionPlayers.delete).toHaveBeenCalledWith({
        where: { sessionUid_userUid: { sessionUid, userUid } },
      });
      expect(mockPrismaService.conversations.findFirst).toHaveBeenCalledWith({
        where: { sessionUid },
      });
      expect(mockPrismaService.conversationMembers.delete).toHaveBeenCalledWith({
        where: { conversationUid_userUid: { conversationUid, userUid } },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(`Player ${userUid} left session ${sessionUid}`);
    });

    it('should throw BadRequestException when session has already started', async () => {
      const startedSession = { ...mockSession, startDate: pastDate } as any;

      await expect(service.leaveSession(startedSession, userUid)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.sessionPlayers.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when player is not in session', async () => {
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.leaveSession(mockSession, userUid)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.sessionPlayers.delete).not.toHaveBeenCalled();
    });
  });

  describe('switchPlayerToAnotherTeam', () => {
    const sessionUid = 'session-uid-123';
    const userUid = 'user-uid-789';
    const teamUid = 'team-uid-456';
    const otherTeamUid = 'team-uid-999';

    const mockSession = {
      uid: sessionUid,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } as any;

    it('should update player team when team and player exist and player is on another team', async () => {
      const mockTeam = { uid: teamUid, sessionUid } as any;
      const mockPlayer = { sessionUid, userUid, teamUid: otherTeamUid } as any;
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (mockPrismaService.sessionPlayers.update as jest.Mock).mockResolvedValue({
        ...mockPlayer,
        teamUid,
      });

      await service.switchPlayerToAnotherTeam(mockSession, userUid, teamUid);

      expect(mockPrismaService.sessionTeams.findUnique).toHaveBeenCalledWith({
        where: { sessionUid, uid: teamUid },
      });
      expect(mockPrismaService.sessionPlayers.findUnique).toHaveBeenCalledWith({
        where: { sessionUid_userUid: { sessionUid, userUid } },
      });
      expect(mockPrismaService.sessionPlayers.update).toHaveBeenCalledWith({
        data: { teamUid },
        where: { sessionUid_userUid: { sessionUid, userUid } },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Player ${userUid} switched to team ${teamUid} in session ${sessionUid}`,
      );
    });

    it('should throw BadRequestException when team does not exist', async () => {
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.switchPlayerToAnotherTeam(mockSession, userUid, teamUid),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.sessionPlayers.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when player does not exist', async () => {
      const mockTeam = { uid: teamUid, sessionUid } as any;
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.switchPlayerToAnotherTeam(mockSession, userUid, teamUid),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.sessionPlayers.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when player is already on the team', async () => {
      const mockTeam = { uid: teamUid, sessionUid } as any;
      const mockPlayer = { sessionUid, userUid, teamUid } as any;
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

      await expect(
        service.switchPlayerToAnotherTeam(mockSession, userUid, teamUid),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.sessionPlayers.update).not.toHaveBeenCalled();
    });
  });

  describe('joinSession', () => {
    const sessionUid = 'session-uid-123';
    const userUid = 'user-uid-789';
    const teamUid = 'team-uid-456';
    const conversationUid = 'conv-uid-123';

    const mockSession = {
      creatorUid: 'creator-uid-1',
      maxPlayersPerTeam: 10,
      uid: sessionUid,
      visibility: 'PUBLIC',
    } as any;

    const mockDto = {
      sessionUid,
      teamUid,
      userUid,
    };

    it('should successfully join a session', async () => {
      const mockNewPlayer = {
        session: { conversation: { uid: conversationUid } },
        sessionUid,
        user: { firstname: 'John', imageUrl: 'avatar', lastname: 'Doe', uid: userUid },
      };

      jest.spyOn(service, 'verifyPlayerEligibilityBeforeJoin').mockResolvedValue(undefined);
      (mockPrismaService.sessionPlayers.create as jest.Mock).mockResolvedValue(mockNewPlayer);

      const result = await service.joinSession(mockDto as any, mockSession);

      expect(service.verifyPlayerEligibilityBeforeJoin).toHaveBeenCalledWith(
        userUid,
        teamUid,
        mockSession,
      );
      expect(prismaService.sessionPlayers.create).toHaveBeenCalled();
      expect(result).toEqual({
        conversationUid,
        sessionUid,
      });
    });
  });

  describe('verifyPlayerEligibilityBeforeJoin', () => {
    const sessionUid = 'session-uid-123';
    const userUid = 'user-uid-789';
    const teamUid = 'team-uid-456';
    const creatorUid = 'creator-uid-1';

    const mockSession = {
      creatorUid,
      maxPlayersPerTeam: 2,
      uid: sessionUid,
      visibility: 'PUBLIC',
    } as any;

    it('should throw ForbiddenException if session is private and user is not a friend', async () => {
      const privateSession = { ...mockSession, visibility: 'PRIVATE' };
      (mockPrismaService.friends.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(
        service.verifyPlayerEligibilityBeforeJoin(userUid, teamUid, privateSession),
      ).rejects.toThrow('You are not a friend of the session creator');
    });

    it('should throw NotFoundException if team does not exist', async () => {
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyPlayerEligibilityBeforeJoin(userUid, teamUid, mockSession),
      ).rejects.toThrow(`Team ${teamUid} not found`);
    });

    it('should throw BadRequestException if team is full', async () => {
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue({
        _count: { sessionPlayers: 2 },
        sessionUid,
      });

      await expect(
        service.verifyPlayerEligibilityBeforeJoin(userUid, teamUid, mockSession),
      ).rejects.toThrow(`Team ${teamUid} is full`);
    });

    it('should throw BadRequestException if player is already in session', async () => {
      (mockPrismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue({
        _count: { sessionPlayers: 1 },
        sessionUid,
      });
      (mockPrismaService.sessionPlayers.findFirst as jest.Mock).mockResolvedValue({ uid: 'p1' });

      await expect(
        service.verifyPlayerEligibilityBeforeJoin(userUid, teamUid, mockSession),
      ).rejects.toThrow(`Player ${userUid} already in session ${sessionUid}`);
  describe('checkIfUsersArePlayers', () => {
    const sessionUid = 'session-123';
    const userUids = ['user-1', 'user-2'];

    it('should return true if all users are players', async () => {
      (mockPrismaService.sessionPlayers.findMany as jest.Mock).mockResolvedValue([
        { userUid: 'user-1' },
        { userUid: 'user-2' },
      ]);

      const result = await service.checkIfUsersArePlayers(sessionUid, userUids);

      expect(result).toBe(true);
      expect(mockPrismaService.sessionPlayers.findMany).toHaveBeenCalledWith({
        where: {
          sessionUid,
          userUid: { in: userUids },
        },
        select: { userUid: true },
      });
    });

    it('should return false if not all users are players', async () => {
      (mockPrismaService.sessionPlayers.findMany as jest.Mock).mockResolvedValue([
        { userUid: 'user-1' },
      ]);

      const result = await service.checkIfUsersArePlayers(sessionUid, userUids);

      expect(result).toBe(false);
    });
  });

  describe('updateRatingStatus', () => {
    const sessionUid = 'session-123';
    const userUid = 'user-1';

    it('should successfully update status', async () => {
      const mockPlayer = { sessionUid, userUid, ratingStatus: RatingStatus.PENDING };
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (mockPrismaService.sessionPlayers.update as jest.Mock).mockResolvedValue(undefined);

      await service.updateRatingStatus(userUid, sessionUid, RatingStatus.VALIDATED);

      expect(mockPrismaService.sessionPlayers.update).toHaveBeenCalledWith({
        where: { sessionUid_userUid: { sessionUid, userUid } },
        data: { ratingStatus: RatingStatus.VALIDATED },
      });
    });

    it('should return immediately if status is already the same', async () => {
      const mockPlayer = { sessionUid, userUid, ratingStatus: RatingStatus.VALIDATED };
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

      await service.updateRatingStatus(userUid, sessionUid, RatingStatus.VALIDATED);

      expect(mockPrismaService.sessionPlayers.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if player not found', async () => {
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateRatingStatus(userUid, sessionUid, RatingStatus.VALIDATED),
      ).rejects.toThrow(new BadRequestException('Player not found'));
    });

    it('should throw BadRequestException for invalid status transitions', async () => {
      const mockPlayer = { sessionUid, userUid, ratingStatus: RatingStatus.VALIDATED };
      (mockPrismaService.sessionPlayers.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

      await expect(
        service.updateRatingStatus(userUid, sessionUid, RatingStatus.PENDING),
      ).rejects.toThrow(new BadRequestException('You cannot unvalidate a rating'));
    });
  });
});

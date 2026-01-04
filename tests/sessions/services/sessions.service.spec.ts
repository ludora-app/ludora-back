import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GameModes } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionScope, Sport } from 'src/shared/constants/constants';
import { DateUtils } from 'src/shared/utils/date.utils';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { FindAllSessionsDto, SessionFilterDto } from 'src/sessions/dto/input/session-filter.dto';
import { UpdateSessionDto } from 'src/sessions/dto/input/update-session.dto';
import { UserHourPreferencesService } from 'src/user-hour-preferences/user-hour-preferences.service';
import { UserSportPreferencesService } from 'src/user-sport-preferences/user-sport-preferences.service';
import { CreateSessionDto } from 'src/sessions/dto/input/create-session.dto';
import { SessionOwnnership } from 'src/sessions/dto/input/my-session-filter.dto';

jest.mock('src/shared/utils/date.utils', () => ({
  DateUtils: {
    formatDate: jest.fn().mockReturnValue('2023-01-01'),
    timeStringToMinutes: jest.fn().mockImplementation((time) => {
      if (time === '08:00:00') return 480; // 8 hours * 60 minutes
      if (time === '22:00:00') return 1320; // 22 hours * 60 minutes
      if (time === '16:00:00') return 960; // 16 hours * 60 minutes
      return 0;
    }),
  },
}));
const mockStorageService = {
  upload: jest.fn(),
  getSignedUrl: jest.fn(),
};

const mockUserHourPreferencesService = {
  findAllByUserUid: jest.fn().mockResolvedValue({ items: [] }),
};

const mockUserSportPreferencesService = {
  findAllByUserUid: jest.fn().mockResolvedValue({ items: [] }),
};

describe('SessionsService', () => {
  let service: SessionsService;
  let prismaService: PrismaService;
  let sessionTeamsService: SessionTeamsService;
  let sessionPlayersService: SessionPlayersService;
  let conversationsService: ConversationsService;

  // Mock dates for consistent testing
  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');
  const mockFutureDate = new Date('2023-01-10T14:00:00Z');
  const mockFutureEndDate = new Date('2023-01-10T16:00:00Z');

  beforeEach(async () => {
    // Mock current date
    const OriginalDate = global.Date;
    jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (!args.length) {
        return mockCurrentDate;
      }
      return new OriginalDate(...args);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            $queryRawUnsafe: jest.fn(),
            fields: {
              findUnique: jest.fn(),
            },
            sessions: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: SessionTeamsService,
          useValue: {
            createDefaultTeams: jest.fn(),
            findTeamsBySessionUid: jest.fn(),
            findOneByUid: jest.fn(),
          },
        },
        {
          provide: SessionPlayersService,
          useValue: {
            addPlayerToSession: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ConversationsService,
          useValue: {
            createSessionConversation: jest.fn(),
          },
        },
        {
          provide: UserHourPreferencesService,
          useValue: mockUserHourPreferencesService,
        },
        {
          provide: UserSportPreferencesService,
          useValue: mockUserSportPreferencesService,
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    sessionTeamsService = module.get<SessionTeamsService>(SessionTeamsService);
    sessionPlayersService = module.get<SessionPlayersService>(SessionPlayersService);
    conversationsService = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSessionDto: CreateSessionDto = {
      endDate: mockFutureEndDate.toISOString(),
      fieldUid: 'field-uid-1',
      startDate: mockFutureDate.toISOString(),
      description: 'Test session',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      title: 'Test Session Title',
      gameMode: GameModes.FIVE_V_FIVE,
      userUid: 'user-uid-1',
    };

    const mockField = {
      uid: 'field-uid-1',
      sport: Sport.FOOTBALL,
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
    };

    const mockOpeningHours = {
      partnerUid: 'partner-uid-1',
      dayOfWeek: 2, // Tuesday
      openTime: '08:00:00',
      closeTime: '22:00:00',
      isClosed: false,
    };

    const mockCreatedSession = {
      uid: 'session-uid-1',
      description: 'Test session',
      endDate: mockFutureEndDate,
      fieldUid: 'field-uid-1',
      gameMode: '5v5',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate,
      teamsPerGame: 2,
      title: 'Test Session Title',
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    it('should create a session successfully', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
      // mock transaction to use same session mocks
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = {
          conversations: {
            create: jest.fn().mockResolvedValue({ uid: 'conv-123' }),
          },
          conversationMembers: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          sessions: prismaService.sessions,
        } as any;
        return cb(tx);
      });
      // teams created in tx and returned including team A
      (sessionTeamsService.createDefaultTeams as jest.Mock).mockResolvedValue([
        {
          uid: 'team-a',
          sessionUid: 'session-uid-1',
          teamLabel: 'A',
          teamName: 'Team A',
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
      ]);

      // Act
      const result = await service.create(createSessionDto);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          uid: 'session-uid-1',
          title: 'Test Session Title',
        }),
      );
      expect(prismaService.fields.findUnique).toHaveBeenCalledWith({
        where: { uid: 'field-uid-1' },
      });
      expect(prismaService.sessions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fieldUid: 'field-uid-1',
          title: 'Test Session Title',
        }),
      });
    });

    it('should auto-generate a title if none provided', async () => {
      // Arrange
      const dtoWithoutTitle = { ...createSessionDto, title: undefined };
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessions.create as jest.Mock).mockResolvedValue({
        ...mockCreatedSession,
        title: `Session de FOOTBALL le 2023-01-01`,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = {
          conversations: {
            create: jest.fn().mockResolvedValue({ uid: 'conv-123' }),
          },
          conversationMembers: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          sessions: prismaService.sessions,
        } as any;
        return cb(tx);
      });
      (sessionTeamsService.createDefaultTeams as jest.Mock).mockResolvedValue([
        {
          uid: 'team-a',
          sessionUid: 'session-uid-1',
          teamLabel: 'A',
          teamName: 'Team A',
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
      ]);

      // Act
      await service.create(dtoWithoutTitle);

      // Assert
      expect(DateUtils.formatDate).toHaveBeenCalledWith(mockFutureDate.toISOString());
      expect(prismaService.sessions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: `Session de FOOTBALL le 2023-01-01`,
        }),
      });
    });

    it('should throw BadRequestException if field not found', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createSessionDto)).rejects.toThrow(
        new BadRequestException('Field not found'),
      );
    });

    it('should throw BadRequestException if session is in the past', async () => {
      // Arrange
      const pastStartDate = new Date('2022-01-01T12:00:00Z');
      const pastEndDate = new Date('2022-01-01T14:00:00Z');
      const pastSessionDto = {
        ...createSessionDto,
        startDate: pastStartDate.toISOString(),
        endDate: pastEndDate.toISOString(),
      };

      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);

      // Act & Assert
      await expect(service.create(pastSessionDto)).rejects.toThrow(
        new BadRequestException('The session is in the past'),
      );
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      // Arrange
      const invalidDateSessionDto = {
        ...createSessionDto,
        endDate: new Date('2023-01-09T14:00:00Z').toISOString(), // End before start
      };

      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);

      // Act & Assert
      await expect(service.create(invalidDateSessionDto)).rejects.toThrow(
        new BadRequestException('The end date must be after the start date'),
      );
    });

    it('should throw BadRequestException if there is a session conflict', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue({
        uid: 'existing-session-uid',
      });

      // Act & Assert
      await expect(service.create(createSessionDto)).rejects.toThrow(
        new BadRequestException('Another session is already scheduled at this time on this field'),
      );
    });
  });

  describe('findAll', () => {
    // Mock data for raw query result format
    const mockRawQueryResult = [
      {
        uid: 'session-uid-1',
        score: 1000,
        start_date: new Date('2023-01-10T14:00:00Z'),
        total_count: BigInt(2),
        distance_val: 500,
      },
      {
        uid: 'session-uid-2',
        score: 900,
        start_date: new Date('2023-01-11T14:00:00Z'),
        total_count: BigInt(2),
        distance_val: 1000,
      },
    ];

    const mockSessionsFromDb = [
      {
        uid: 'session-uid-1',
        creatorUid: 'user-uid-1',
        endDate: new Date('2023-01-10T16:00:00Z'),
        startDate: new Date('2023-01-10T14:00:00Z'),
        sport: Sport.FOOTBALL,
        gameMode: 'FIVE_V_FIVE',
        maxPlayersPerTeam: 5,
        field: {
          shortAddress: '123 Main St, Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          fieldImages: [{ url: 'https://example.com/field1.jpg' }],
        },
        sessionTeams: [
          { teamName: 'Team A', _count: { sessionPlayers: 3 } },
          { teamName: 'Team B', _count: { sessionPlayers: 2 } },
        ],
      },
      {
        uid: 'session-uid-2',
        creatorUid: 'user-uid-2',
        endDate: new Date('2023-01-11T16:00:00Z'),
        startDate: new Date('2023-01-11T14:00:00Z'),
        sport: 'BASKETBALL',
        gameMode: 'FIVE_V_FIVE',
        maxPlayersPerTeam: 5,
        field: {
          shortAddress: '456 Rue de Test, Paris',
          latitude: 48.8567,
          longitude: 2.3523,
          fieldImages: [],
        },
        sessionTeams: [
          { teamName: 'Team A', _count: { sessionPlayers: 4 } },
          { teamName: 'Team B', _count: { sessionPlayers: 5 } },
        ],
      },
    ];

    it('should return a list of sessions when user has location', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        userLat: 48.8566,
        userLon: 2.3522,
        limit: 10,
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue(mockRawQueryResult);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessionsFromDb);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            uid: 'session-uid-1',
          }),
        ]),
        nextCursor: null,
        totalCount: 2,
      });
    });

    it('should return empty result when no filtering criteria provided', async () => {
      // Arrange - no location, no sports, no time prefs, no urgent, no date
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        limit: 10,
      };

      // Act
      const result = await service.findAll(filter);

      // Assert - should return empty due to safety barrier
      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });

    it('should handle pagination with cursor', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        userLat: 48.8566,
        userLon: 2.3522,
        limit: 1,
        cursor: '1',
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue([mockRawQueryResult[1]]);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSessionsFromDb[1]]);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should return the next cursor when more results exist', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        userLat: 48.8566,
        userLon: 2.3522,
        limit: 1,
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue(mockRawQueryResult);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSessionsFromDb[0]]);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('1');
    });

    it('should filter by sports when provided', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue(mockRawQueryResult);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessionsFromDb);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should filter by start and end date range', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-31T23:59:59Z'),
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue(mockRawQueryResult);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessionsFromDb);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should filter urgent sessions when urgent flag is set', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        userUid: 'user-uid-1',
        userLat: 48.8566,
        userLon: 2.3522,
        urgent: true,
      };
      (prismaService.$queryRaw as jest.Mock) = jest.fn().mockResolvedValue(mockRawQueryResult);
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessionsFromDb);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    const mockSession = {
      uid: 'session-uid-1',
      description: 'Test session',
      endDate: new Date('2023-01-10T16:00:00Z'),
      fieldUid: 'field-uid-1',
      gameMode: '5v5',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      teamsPerGame: 2,
      title: 'Test Session Title',
      createdAt: new Date('2023-01-01T12:00:00Z'),
      updatedAt: new Date('2023-01-01T12:00:00Z'),
    };

    it('should return a session by uid', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);

      // Act
      const result = await service.findOne('session-uid-1');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          uid: 'session-uid-1',
        }),
      );
      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { uid: 'session-uid-1' },
      });
    });

    it('should return null if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.findOne('non-existent-uid');

      // Assert
      expect(result).toBeNull();
      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { uid: 'non-existent-uid' },
      });
    });
  });

  describe('update', () => {
    const updateSessionDto: UpdateSessionDto = {
      endDate: mockFutureEndDate.toISOString(),
      startDate: mockFutureDate.toISOString(),
      description: 'Updated session',
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      teamsPerGame: 2,
      title: 'Updated Session Title',
    };

    const mockSession = {
      uid: 'session-uid-1',
      fieldUid: 'field-uid-1',
    };

    const mockField = {
      uid: 'field-uid-1',
      sport: Sport.FOOTBALL,
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
    };

    const mockOpeningHours = {
      partnerUid: 'partner-uid-1',
      dayOfWeek: 2, // Tuesday
      openTime: '08:00:00',
      closeTime: '22:00:00',
      isClosed: false,
    };

    const mockUpdatedSession = {
      uid: 'session-uid-1',
      description: 'Updated session',
      endDate: mockFutureEndDate,
      fieldUid: 'field-uid-1',
      gameMode: '5v5',
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate,
      teamsPerGame: 2,
      title: 'Updated Session Title',
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    it('should update a session successfully', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.update as jest.Mock).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = await service.update('session-uid-1', updateSessionDto);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          uid: 'session-uid-1',
          title: 'Updated Session Title',
        }),
      );
      expect(prismaService.sessions.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Updated Session Title',
        }),
        where: { uid: 'session-uid-1' },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent-uid', updateSessionDto)).rejects.toThrow(
        new NotFoundException('Session not found'),
      );
    });

    it('should throw NotFoundException if field not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('session-uid-1', updateSessionDto)).rejects.toThrow(
        new NotFoundException('Field not found'),
      );
    });
  });

  describe('remove', () => {
    it('should return a string message', () => {
      const result = service.remove('1');
      expect(result).toBe('This action removes a #1 session');
    });
  });

  describe('joinSession', () => {
    const mockCreateSessionPlayerDto = {
      sessionUid: 'session-uid-123',
      teamUid: 'team-uid-456',
      userUid: 'user-uid-789',
    };

    const mockSession = {
      uid: 'session-uid-123',
      maxPlayersPerTeam: 10,
    };

    const mockTeam = {
      uid: 'team-uid-456',
      sessionUid: 'session-uid-123',
      _count: {
        sessionPlayers: 5,
      },
    };

    const mockNewPlayer = {
      uid: 'player-uid-101',
      sessionUid: 'session-uid-123',
      teamUid: 'team-uid-456',
      userUid: 'user-uid-789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully add a player to a session when all validations pass', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (sessionTeamsService.findOneByUid as jest.Mock).mockResolvedValue(mockTeam);
      (sessionPlayersService.findOne as jest.Mock).mockResolvedValue(null);
      (sessionPlayersService.addPlayerToSession as jest.Mock).mockResolvedValue(mockNewPlayer);

      const result = await service.joinSession(mockCreateSessionPlayerDto as any);

      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { uid: mockCreateSessionPlayerDto.sessionUid },
      });
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(sessionPlayersService.findOne).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.sessionUid,
        mockCreateSessionPlayerDto.userUid,
      );
      expect(sessionPlayersService.addPlayerToSession).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto,
      );
      expect(result).toEqual(mockNewPlayer);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new NotFoundException(`Session ${mockCreateSessionPlayerDto.sessionUid} not found`),
      );

      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { uid: mockCreateSessionPlayerDto.sessionUid },
      });
      expect(sessionTeamsService.findOneByUid).not.toHaveBeenCalled();
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when team does not exist', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (sessionTeamsService.findOneByUid as jest.Mock).mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new NotFoundException(`Team ${mockCreateSessionPlayerDto.teamUid} not found`),
      );

      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { uid: mockCreateSessionPlayerDto.sessionUid },
      });
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when session and team do not match', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (sessionTeamsService.findOneByUid as jest.Mock).mockResolvedValue({
        ...mockTeam,
        sessionUid: 'different-session-uid',
      });

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new BadRequestException(
          `Session ${mockCreateSessionPlayerDto.sessionUid} and team ${mockCreateSessionPlayerDto.teamUid} do not match`,
        ),
      );

      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when team is full', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (sessionTeamsService.findOneByUid as jest.Mock).mockResolvedValue({
        ...mockTeam,
        _count: { sessionPlayers: 10 },
      });

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new BadRequestException(`Team ${mockCreateSessionPlayerDto.teamUid} is full`),
      );

      expect(sessionPlayersService.findOne).not.toHaveBeenCalled();
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when player already exists in session', async () => {
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (sessionTeamsService.findOneByUid as jest.Mock).mockResolvedValue(mockTeam);
      (sessionPlayersService.findOne as jest.Mock).mockResolvedValue({ uid: 'existing-player' });

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new BadRequestException(
          `Player ${mockCreateSessionPlayerDto.userUid} already in session ${mockCreateSessionPlayerDto.sessionUid}`,
        ),
      );

      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });
  });

  describe('findAllByUserUid', () => {
    const userUid = 'user-uid-1';
    const mockSession1 = {
      uid: 'session-uid-1',
      title: 'Test Session 1',
      description: 'Test session 1',
      sport: Sport.FOOTBALL,
      gameMode: GameModes.FIVE_V_FIVE,
      startDate: mockFutureDate,
      endDate: mockFutureEndDate,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      creatorUid: userUid,
      fieldUid: 'field-uid-1',
      createdAt: new Date('2023-01-05T10:00:00Z'),
      field: {
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
        fieldImages: [{ url: 'image1.jpg' }],
      },
      sessionTeams: [
        { teamName: 'Team A', _count: { sessionPlayers: 3 } },
        { teamName: 'Team B', _count: { sessionPlayers: 2 } },
      ],
    };

    const mockSession2 = {
      uid: 'session-uid-2',
      title: 'Test Session 2',
      description: 'Test session 2',
      sport: Sport.BASKETBALL,
      gameMode: GameModes.FIVE_V_FIVE,
      startDate: new Date('2023-01-12T14:00:00Z'),
      endDate: new Date('2023-01-12T16:00:00Z'),
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      creatorUid: 'other-user-uid',
      fieldUid: 'field-uid-2',
      createdAt: new Date('2023-01-06T10:00:00Z'),
      field: {
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
        fieldImages: [{ url: 'image2.jpg' }],
      },
      sessionTeams: [
        { teamName: 'Team A', _count: { sessionPlayers: 4 } },
        { teamName: 'Team B', _count: { sessionPlayers: 3 } },
      ],
    };

    const mockPastSession = {
      uid: 'session-uid-3',
      title: 'Past Session',
      description: 'Past session',
      sport: Sport.FOOTBALL,
      gameMode: GameModes.FIVE_V_FIVE,
      startDate: new Date('2022-12-01T14:00:00Z'),
      endDate: new Date('2022-12-01T16:00:00Z'),
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      creatorUid: userUid,
      fieldUid: 'field-uid-1',
      createdAt: new Date('2022-11-25T10:00:00Z'),
      field: {
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
        fieldImages: [{ url: 'image3.jpg' }],
      },
      sessionTeams: [
        { teamName: 'Team A', _count: { sessionPlayers: 5 } },
        { teamName: 'Team B', _count: { sessionPlayers: 5 } },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return sessions where user is creator when ownership is CREATOR', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should return sessions where user is a player when ownership is PLAYER', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession2]);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.PLAYER,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { sessionPlayers: { some: { userUid } } },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should return both creator and player sessions when ownership is not specified', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      const result = await service.findAllByUserUid(userUid, {});

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ creatorUid: userUid }, { sessionPlayers: { some: { userUid } } }],
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter sessions by minStart date', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession2]);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        minStart,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { gte: minStart },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter sessions by maxStart date', async () => {
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        maxStart,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { lte: maxStart },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter sessions by date range (minStart and maxStart)', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        minStart,
        maxStart,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { gte: minStart, lte: maxStart },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter sessions by endDate', async () => {
      const endDate = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        endDate,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          endDate: { lte: endDate },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter upcoming sessions when scope is UPCOMING', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        scope: SessionScope.UPCOMING,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { gte: mockCurrentDate },
        },
        orderBy: undefined,
        select: expect.objectContaining({
          uid: true,
          sport: true,
          startDate: true,
        }),
      });
    });

    it('should filter past sessions when scope is PAST', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockPastSession]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        scope: SessionScope.PAST,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { lt: mockCurrentDate },
        },
        orderBy: undefined,
        select: expect.objectContaining({
          uid: true,
          sport: true,
          startDate: true,
        }),
      });
    });

    it('should filter sessions by sports', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL],
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          sport: { in: [Sport.FOOTBALL] },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should filter sessions by multiple sports', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          sport: { in: [Sport.FOOTBALL, Sport.BASKETBALL] },
        },
        orderBy: undefined,
        select: expect.any(Object),
      });
    });

    it('should sort sessions by startDate in ascending order', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'asc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
        orderBy: [{ startDate: 'asc' }],
        select: expect.any(Object),
      });
    });

    it('should sort sessions by startDate in descending order', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession2,
        mockSession1,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'desc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
        orderBy: [{ startDate: 'desc' }],
        select: expect.any(Object),
      });
    });

    it('should sort sessions by createdAt', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        createdAtSortOrder: 'desc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
        orderBy: [{ createdAt: 'desc' }],
        select: expect.any(Object),
      });
    });

    it('should sort sessions by multiple criteria', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'asc',
        createdAtSortOrder: 'desc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        select: expect.any(Object),
      });
    });

    it('should apply multiple filters at once', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        minStart,
        maxStart,
        sports: [Sport.FOOTBALL],
        scope: SessionScope.UPCOMING,
        startDateSortOrder: 'asc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        where: {
          creatorUid: userUid,
          startDate: { gte: mockCurrentDate, lte: maxStart },
          sport: { in: [Sport.FOOTBALL] },
        },
        orderBy: [{ startDate: 'asc' }],
        select: expect.objectContaining({
          uid: true,
          sport: true,
          startDate: true,
        }),
      });
    });

    it('should return empty array when no sessions found', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.nextCursor).toBeNull();
    });
  });
});

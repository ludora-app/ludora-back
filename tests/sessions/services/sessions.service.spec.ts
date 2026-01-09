import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FieldType, GameModes } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionScope, SessionSportLevel, Sport } from 'src/shared/constants/constants';
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
import { FieldSlotsService } from 'src/fields/services/field-slots.service';

jest.mock('src/shared/utils/date.utils', () => ({
  DateUtils: {
    formatDate: jest.fn().mockReturnValue('2023-01-01'),
    timeStringToMinutes: jest.fn().mockImplementation((time) => {
      if (time === '08:00:00') return 480; // 8 hours * 60 minutes
      if (time === '22:00:00') return 1320; // 22 hours * 60 minutes
      if (time === '16:00:00') return 960; // 16 hours * 60 minutes
      return 0;
    }),
    checkValidityForCreation: jest.fn().mockImplementation((startDate: string, endDate: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date('2023-01-01T12:00:00Z'); // Use mock current date

      if (start < now) {
        throw new Error('The session is in the past');
      }
      if (end <= start) {
        throw new Error('The end date must be after the start date');
      }
    }),
    getHoursForPeriod: jest.fn().mockImplementation((period) => {
      // Mock implementation for time period
      return { min: 0, max: 24 };
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
  let fieldSlotsService: FieldSlotsService;

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
            sessionTeams: {
              findUnique: jest.fn(),
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
          provide: FieldSlotsService,
          useValue: {
            findOne: jest.fn(),
            markAsReserved: jest.fn(),
          },
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
    fieldSlotsService = module.get<FieldSlotsService>(FieldSlotsService);
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
      title: 'Test Session Title',
      gameMode: GameModes.FIVE_V_FIVE,
      userUid: 'user-uid-1',
      level: SessionSportLevel.BEGINNER,
    };

    const mockPublicField = {
      uid: 'field-uid-1',
      sport: Sport.FOOTBALL,
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      type: FieldType.PUBLIC,
    };

    const mockPrivateField = {
      uid: 'field-uid-2',
      sport: Sport.FOOTBALL,
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      type: FieldType.PRIVATE,
    };

    const mockCreatedSession = {
      uid: 'session-uid-1',
      description: 'Test session',
      endDate: mockFutureEndDate,
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate,
      teamsPerGame: 2,
      title: 'Test Session Title',
      level: SessionSportLevel.BEGINNER,
      slotUid: null,
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    const mockFieldSlot = {
      uid: 'slot-uid-1',
      fieldUid: 'field-uid-2',
      startTime: mockFutureDate,
      endTime: mockFutureEndDate,
      gameMode: GameModes.FIVE_V_FIVE,
      price: 50,
      isReserved: false,
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    const setupTransactionMock = () => {
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
    };

    describe('PUBLIC fields', () => {
      it('should create a session successfully on a public field', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock();

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
        expect(fieldSlotsService.findOne).not.toHaveBeenCalled();
        expect(fieldSlotsService.markAsReserved).not.toHaveBeenCalled();
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fieldUid: 'field-uid-1',
            title: 'Test Session Title',
            level: SessionSportLevel.BEGINNER,
          }),
        });
      });

      it('should auto-generate a title if none provided', async () => {
        // Arrange
        const dtoWithoutTitle = { ...createSessionDto, title: undefined };
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          title: `Session de FOOTBALL le 2023-01-01`,
        });
        setupTransactionMock();

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

        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);

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

        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);

        // Act & Assert
        await expect(service.create(invalidDateSessionDto)).rejects.toThrow(
          new BadRequestException('The end date must be after the start date'),
        );
      });

      it('should throw BadRequestException if there is a session conflict on a private field', async () => {
        // Arrange
        const privateSessionDto = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue(mockFieldSlot);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue({
          uid: 'existing-session-uid',
        });

        // Act & Assert
        await expect(service.create(privateSessionDto)).rejects.toThrow(
          new BadRequestException(
            'Another session is already scheduled at this time on this field',
          ),
        );
      });
    });

    describe('PRIVATE fields', () => {
      it('should throw BadRequestException if private field requires slotUid but none provided', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);

        const dtoWithoutSlot = { ...createSessionDto, fieldUid: 'field-uid-2' };

        // Act & Assert
        await expect(service.create(dtoWithoutSlot)).rejects.toThrow(
          new BadRequestException('Private fields require a field slot'),
        );
      });

      it('should throw BadRequestException if field slot not found', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue(null);

        const dtoWithSlot = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };

        // Act & Assert
        await expect(service.create(dtoWithSlot)).rejects.toThrow(
          new BadRequestException('Field slot not found'),
        );
      });

      it('should throw BadRequestException if slot is already reserved', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue({
          ...mockFieldSlot,
          isReserved: true,
        });

        const dtoWithSlot = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };

        // Act & Assert
        await expect(service.create(dtoWithSlot)).rejects.toThrow(
          new BadRequestException('The slot is already reserved'),
        );
      });

      it('should throw BadRequestException if slot times do not match session times', async () => {
        // Arrange
        const differentSlotTimes = {
          ...mockFieldSlot,
          startTime: new Date('2023-01-10T10:00:00Z'),
          endTime: new Date('2023-01-10T12:00:00Z'),
        };

        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue(differentSlotTimes);

        const dtoWithSlot = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };

        // Act & Assert
        await expect(service.create(dtoWithSlot)).rejects.toThrow(
          new BadRequestException('The slot is not available at this time'),
        );
      });

      it('should create a session successfully on a private field with valid slot', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue(mockFieldSlot);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        });
        setupTransactionMock();
        (fieldSlotsService.markAsReserved as jest.Mock).mockResolvedValue(undefined);

        const dtoWithSlot = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };

        // Act
        const result = await service.create(dtoWithSlot);

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            uid: 'session-uid-1',
            slotUid: 'slot-uid-1',
          }),
        );
        expect(fieldSlotsService.findOne).toHaveBeenCalledWith('slot-uid-1');
        expect(fieldSlotsService.markAsReserved).toHaveBeenCalledWith('slot-uid-1');
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fieldUid: 'field-uid-2',
            slotUid: 'slot-uid-1',
          }),
        });
      });

      it('should mark slot as reserved after session creation', async () => {
        // Arrange
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPrivateField);
        (fieldSlotsService.findOne as jest.Mock).mockResolvedValue(mockFieldSlot);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        });
        setupTransactionMock();
        (fieldSlotsService.markAsReserved as jest.Mock).mockResolvedValue(undefined);

        const dtoWithSlot = {
          ...createSessionDto,
          fieldUid: 'field-uid-2',
          slotUid: 'slot-uid-1',
        };

        // Act
        await service.create(dtoWithSlot);

        // Assert
        expect(fieldSlotsService.markAsReserved).toHaveBeenCalledWith('slot-uid-1');
        expect(fieldSlotsService.markAsReserved).toHaveBeenCalledTimes(1);
      });
    });

    describe('Level handling', () => {
      it('should create a session with specified level', async () => {
        // Arrange
        const dtoWithAdvancedLevel = {
          ...createSessionDto,
          level: SessionSportLevel.ADVANCED,
        };
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          level: SessionSportLevel.ADVANCED,
        });
        setupTransactionMock();

        // Act
        const result = await service.create(dtoWithAdvancedLevel);

        // Assert
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            level: SessionSportLevel.ADVANCED,
          }),
        });
        expect(result.level).toBe(SessionSportLevel.ADVANCED);
      });

      it('should create a session without level if not provided', async () => {
        // Arrange
        const dtoWithoutLevel = { ...createSessionDto, level: undefined };
        (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          level: undefined,
        });
        setupTransactionMock();

        // Act
        await service.create(dtoWithoutLevel);

        // Assert
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            level: undefined,
          }),
        });
      });
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
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      maxPlayersPerTeam: 5,
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      visibility: 'PUBLIC',
      field: {
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris, France',
        fieldImages: [
          { order: 1, url: 'image1.jpg' },
          { order: 2, url: 'image2.jpg' },
        ],
      },
      sessionTeams: [
        {
          teamName: 'Team A',
          teamLabel: 'A',
          sessionPlayers: [
            {
              userUid: 'user-1',
              teamUid: 'team-1',
              user: {
                firstname: 'John',
                lastname: 'Doe',
                imageUrl: 'user1.jpg',
              },
            },
          ],
        },
      ],
    };

    it('should return a session by uid', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (mockStorageService.getSignedUrl as jest.Mock).mockImplementation(
        async (folder: string, url: string) => `https://signed-url.com/${url}`,
      );

      // Act
      const result = await service.findOne('session-uid-1');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          uid: 'session-uid-1',
          fieldImages: expect.arrayContaining([
            expect.objectContaining({ order: 1 }),
            expect.objectContaining({ order: 2 }),
          ]),
          sessionTeams: expect.arrayContaining([
            expect.objectContaining({
              teamName: 'Team A',
              numberOfPlayers: 1,
            }),
          ]),
        }),
      );
      expect(prismaService.sessions.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-uid')).rejects.toThrow(
        new NotFoundException('Session not found'),
      );
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

    const mockSessionForFindOne = {
      uid: 'session-uid-1',
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      maxPlayersPerTeam: 5,
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      visibility: 'PUBLIC',
      field: {
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris, France',
        fieldImages: [{ order: 1, url: 'image1.jpg' }],
      },
      sessionTeams: [
        {
          teamName: 'Team A',
          teamLabel: 'A',
          sessionPlayers: [],
        },
      ],
    };

    const mockField = {
      uid: 'field-uid-1',
      sport: Sport.FOOTBALL,
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      type: FieldType.PUBLIC,
    };

    const mockUpdatedSession = {
      uid: 'session-uid-1',
      description: 'Updated session',
      endDate: mockFutureEndDate,
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
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
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSessionForFindOne);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.update as jest.Mock).mockResolvedValue(mockUpdatedSession);
      (mockStorageService.getSignedUrl as jest.Mock).mockImplementation(
        async (folder: string, url: string) => `https://signed-url.com/${url}`,
      );

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
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSessionForFindOne);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(null);
      (mockStorageService.getSignedUrl as jest.Mock).mockImplementation(
        async (folder: string, url: string) => `https://signed-url.com/${url}`,
      );

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
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      visibility: 'PUBLIC',
      fieldImages: [],
      fieldLatitude: 48.8566,
      fieldLongitude: 2.3522,
      fieldShortAddress: 'Paris, France',
      sessionTeams: [],
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
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      (prismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      (sessionPlayersService.findOne as jest.Mock).mockResolvedValue(null);
      (sessionPlayersService.addPlayerToSession as jest.Mock).mockResolvedValue(mockNewPlayer);

      const result = await service.joinSession(mockCreateSessionPlayerDto as any);

      expect(service.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(prismaService.sessionTeams.findUnique).toHaveBeenCalledWith({
        select: {
          _count: { select: { sessionPlayers: true } },
          sessionUid: true,
        },
        where: { uid: mockCreateSessionPlayerDto.teamUid },
      });
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
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new NotFoundException(`Session ${mockCreateSessionPlayerDto.sessionUid} not found`),
      );

      expect(service.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(prismaService.sessionTeams.findUnique).not.toHaveBeenCalled();
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when team does not exist', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      (prismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new NotFoundException(`Team ${mockCreateSessionPlayerDto.teamUid} not found`),
      );

      expect(service.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(prismaService.sessionTeams.findUnique).toHaveBeenCalledWith({
        select: {
          _count: { select: { sessionPlayers: true } },
          sessionUid: true,
        },
        where: { uid: mockCreateSessionPlayerDto.teamUid },
      });
      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when session and team do not match', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      (prismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue({
        ...mockTeam,
        sessionUid: 'different-session-uid',
      });

      await expect(service.joinSession(mockCreateSessionPlayerDto as any)).rejects.toThrow(
        new BadRequestException(
          `Session ${mockCreateSessionPlayerDto.sessionUid} and team ${mockCreateSessionPlayerDto.teamUid} do not match`,
        ),
      );

      expect(sessionPlayersService.addPlayerToSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when team is full', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      (prismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue({
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
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSession as any);
      (prismaService.sessionTeams.findUnique as jest.Mock).mockResolvedValue(mockTeam);
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

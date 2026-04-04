import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FieldType, GameModes } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { FieldsService } from 'src/fields/services/fields.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from 'src/sessions/dto/input/create-session.dto';
import { SessionOwnnership } from 'src/sessions/dto/input/my-session-filter.dto';
import { FindAllSessionsDto } from 'src/sessions/dto/input/session-filter.dto';
import { UpdateSessionDto } from 'src/sessions/dto/input/update-session.dto';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionScope, SessionSportLevel, Sport } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';

jest.mock('src/shared/utils/date.utils', () => ({
  DateUtils: {
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
    formatDate: jest.fn().mockReturnValue('2023-01-01'),
    getHoursForPeriod: jest.fn().mockImplementation((_period) => {
      // Mock implementation for time period
      return { max: 24, min: 0 };
    }),
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
};

const mockUserHourPreferencesService = {
  findAllByUserUid: jest.fn().mockResolvedValue({ items: [] }),
};

const mockUserSportPreferencesService = {
  findAllByUserUid: jest.fn().mockResolvedValue({ items: [] }),
};

/** Mock shape used in tests so we can access delegates without relying on generated client types in CI */
type MockPrismaLike = {
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $queryRawUnsafe: jest.Mock;
  $executeRawUnsafe: jest.Mock;
  sessions: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
  sessionTeams: { findUnique: jest.Mock };
  fields: { findUnique: jest.Mock };
  sessionPlayers: { findMany: jest.Mock };
  userBlocks: { findFirst: jest.Mock };
};

describe('SessionsService', () => {
  let service: SessionsService;
  let prismaService: PrismaService & MockPrismaLike;
  let sessionTeamsService: SessionTeamsService;
  let sessionPlayersService: SessionPlayersService;
  let _conversationsService: ConversationsService;
  let fieldSlotsService: FieldSlotsService;
  let fieldsService: FieldsService;

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
            $executeRawUnsafe: jest.fn(),
            $queryRawUnsafe: jest.fn(),
            $transaction: jest.fn(),
            fields: {
              findUnique: jest.fn(),
            },
            sessionPlayers: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            sessions: {
              count: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            sessionTeams: {
              findUnique: jest.fn(),
            },
            userBlocks: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
          },
        },
        {
          provide: SessionTeamsService,
          useValue: {
            createDefaultTeams: jest.fn(),
            findOneByUid: jest.fn(),
            findTeamsBySessionUid: jest.fn(),
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
          provide: HourPreferencesService,
          useValue: mockUserHourPreferencesService,
        },
        {
          provide: SportPreferencesService,
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
          provide: FieldsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            info: jest.fn(),
            log: jest.fn(),
            setContext: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prismaService = module.get(PrismaService) as PrismaService & MockPrismaLike;
    sessionTeamsService = module.get<SessionTeamsService>(SessionTeamsService);
    sessionPlayersService = module.get<SessionPlayersService>(SessionPlayersService);
    _conversationsService = module.get<ConversationsService>(ConversationsService);
    fieldSlotsService = module.get<FieldSlotsService>(FieldSlotsService);
    fieldsService = module.get<FieldsService>(FieldsService);
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
      description: 'Test session',
      endDate: mockFutureEndDate.toISOString(),
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.BEGINNER,
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate.toISOString(),
      title: 'Test Session Title',
      userUid: 'user-uid-1',
    };

    const mockPublicField = {
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      sports: [Sport.FOOTBALL],
      type: FieldType.PUBLIC,
      uid: 'field-uid-1',
    };

    const mockPrivateField = {
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      sports: [Sport.FOOTBALL],
      type: FieldType.PRIVATE,
      uid: 'field-uid-2',
    };

    const mockCreatedSession = {
      createdAt: mockCurrentDate,
      creatorUid: 'user-uid-1',
      description: 'Test session',
      endDate: mockFutureEndDate,
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.BEGINNER,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      slotUid: null,
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate,
      teamsPerGame: 2,
      title: 'Test Session Title',
      uid: 'session-uid-1',
      updatedAt: mockCurrentDate,
    };

    const mockFieldSlot = {
      createdAt: mockCurrentDate,
      endTime: mockFutureEndDate,
      fieldUid: 'field-uid-2',
      gameMode: GameModes.FIVE_V_FIVE,
      isReserved: false,
      price: 50,
      startTime: mockFutureDate,
      uid: 'slot-uid-1',
      updatedAt: mockCurrentDate,
    };

    let sessionImagesCreateManyMock: jest.Mock;

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    const setupTransactionMock = (
      teamAName: string = 'Equipe A',
      teamBName: string = 'Equipe B',
    ) => {
      sessionImagesCreateManyMock = jest.fn().mockResolvedValue({ count: 0 });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
        const tx = {
          conversationMembers: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          conversations: {
            create: jest.fn().mockResolvedValue({ uid: 'conv-123' }),
          },
          sessionImages: {
            createMany: sessionImagesCreateManyMock,
          },
          sessions: prismaService.sessions,
        } as any;
        return cb(tx);
      });
      (sessionTeamsService.createDefaultTeams as jest.Mock).mockResolvedValue([
        {
          createdAt: mockCurrentDate,
          sessionUid: 'session-uid-1',
          teamLabel: 'A',
          teamName: teamAName,
          uid: 'team-a',
          updatedAt: mockCurrentDate,
        },
        {
          createdAt: mockCurrentDate,
          sessionUid: 'session-uid-1',
          teamLabel: 'B',
          teamName: teamBName,
          uid: 'team-b',
          updatedAt: mockCurrentDate,
        },
      ]);
    };

    describe('PUBLIC fields', () => {
      it('should create a session successfully on a public field', async () => {
        // Arrange
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock();

        // Act
        const result = await service.create(createSessionDto);

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            title: 'Test Session Title',
            uid: 'session-uid-1',
          }),
        );
        expect(fieldsService.findOne).toHaveBeenCalledWith('field-uid-1');
        expect(fieldSlotsService.findOne).not.toHaveBeenCalled();
        expect(fieldSlotsService.markAsReserved).not.toHaveBeenCalled();
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fieldUid: 'field-uid-1',
            level: SessionSportLevel.BEGINNER,
            title: 'Test Session Title',
          }),
        });
      });

      it('should create a session with auto-generated title when none provided', async () => {
        // Arrange: no title → service generates "Session {sport} le {formatDate(startDate)}" (DateUtils.formatDate mocked to '2023-01-01')
        const dtoWithoutTitle = { ...createSessionDto, title: undefined };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue({
          ...mockCreatedSession,
          title: 'Session FOOTBALL le 2023-01-01',
        });
        setupTransactionMock();

        // Act
        await service.create(dtoWithoutTitle);

        // Assert
        expect(prismaService.sessions.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: 'Session FOOTBALL le 2023-01-01',
          }),
        });
      });

      it('should upload images and create sessionImages when images are provided', async () => {
        const imageUrl = 'https://storage.example.com/sessions/photo.jpg';
        (mockStorageService.upload as jest.Mock).mockResolvedValue({ data: imageUrl });
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock();

        const dtoWithImages = {
          ...createSessionDto,
          images: [{ buffer: Buffer.from('fake-image-data'), originalname: 'photo.jpg' }],
        };

        const result = await service.create(dtoWithImages);

        expect(mockStorageService.upload).toHaveBeenCalledWith(
          expect.any(String),
          'photo.jpg',
          Buffer.from('fake-image-data'),
        );
        expect(sessionImagesCreateManyMock).toHaveBeenCalledWith({
          data: [
            {
              order: 0,
              sessionUid: mockCreatedSession.uid,
              url: imageUrl,
            },
          ],
        });
        expect(result).toEqual(expect.objectContaining({ uid: 'session-uid-1' }));
      });

      it('should throw BadRequestException if field not found', async () => {
        // Arrange
        (fieldsService.findOne as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(createSessionDto)).rejects.toThrow(
          new NotFoundException('Field not found'),
        );
      });

      it('should throw BadRequestException if session is in the past', async () => {
        // Arrange
        const pastStartDate = new Date('2022-01-01T12:00:00Z');
        const pastEndDate = new Date('2022-01-01T14:00:00Z');
        const pastSessionDto = {
          ...createSessionDto,
          endDate: pastEndDate.toISOString(),
          startDate: pastStartDate.toISOString(),
        };

        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);

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

        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);

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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);

        const dtoWithoutSlot = { ...createSessionDto, fieldUid: 'field-uid-2' };

        // Act & Assert
        await expect(service.create(dtoWithoutSlot)).rejects.toThrow(
          new BadRequestException('Private fields require a field slot'),
        );
      });

      it('should throw BadRequestException if field slot not found', async () => {
        // Arrange
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
          endTime: new Date('2023-01-10T12:00:00Z'),
          startTime: new Date('2023-01-10T10:00:00Z'),
        };

        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
            slotUid: 'slot-uid-1',
            uid: 'session-uid-1',
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPrivateField);
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
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
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
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

    describe('Team names handling', () => {
      it('should create teams with custom names when provided', async () => {
        // Arrange
        const customTeamAName = 'Les Bleus';
        const customTeamBName = 'Les Rouges';
        const dtoWithCustomTeamNames = {
          ...createSessionDto,
          teamAName: customTeamAName,
          teamBName: customTeamBName,
        };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock(customTeamAName, customTeamBName);

        // Act
        await service.create(dtoWithCustomTeamNames);

        // Assert
        expect(sessionTeamsService.createDefaultTeams).toHaveBeenCalledWith(
          'session-uid-1',
          customTeamAName,
          customTeamBName,
          expect.anything(),
        );
      });

      it('should use default team names when not provided', async () => {
        // Arrange
        const dtoWithoutTeamNames = { ...createSessionDto };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock('Equipe A', 'Equipe B');

        // Act
        await service.create(dtoWithoutTeamNames);

        // Assert
        expect(sessionTeamsService.createDefaultTeams).toHaveBeenCalledWith(
          'session-uid-1',
          'Equipe A',
          'Equipe B',
          expect.anything(),
        );
      });

      it('should handle only teamAName provided', async () => {
        // Arrange
        const customTeamAName = 'Custom Team A';
        const dtoWithOnlyTeamAName = {
          ...createSessionDto,
          teamAName: customTeamAName,
        };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock(customTeamAName, 'Equipe B');

        // Act
        await service.create(dtoWithOnlyTeamAName);

        // Assert
        expect(sessionTeamsService.createDefaultTeams).toHaveBeenCalledWith(
          'session-uid-1',
          customTeamAName,
          'Equipe B',
          expect.anything(),
        );
      });

      it('should handle only teamBName provided', async () => {
        // Arrange
        const customTeamBName = 'Custom Team B';
        const dtoWithOnlyTeamBName = {
          ...createSessionDto,
          teamBName: customTeamBName,
        };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock('Equipe A', customTeamBName);

        // Act
        await service.create(dtoWithOnlyTeamBName);

        // Assert
        expect(sessionTeamsService.createDefaultTeams).toHaveBeenCalledWith(
          'session-uid-1',
          'Equipe A',
          customTeamBName,
          expect.anything(),
        );
      });

      it('should add creator to team A with correct team name', async () => {
        // Arrange
        const customTeamAName = 'Les Bleus';
        const customTeamBName = 'Les Rouges';
        const dtoWithCustomTeamNames = {
          ...createSessionDto,
          teamAName: customTeamAName,
          teamBName: customTeamBName,
        };
        (fieldsService.findOne as jest.Mock).mockResolvedValue(mockPublicField);
        (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);
        setupTransactionMock(customTeamAName, customTeamBName);

        // Act
        await service.create(dtoWithCustomTeamNames);

        // Assert
        expect(sessionPlayersService.addPlayerToSession).toHaveBeenCalledWith(
          {
            sessionUid: 'session-uid-1',
            teamUid: 'team-a',
            userUid: 'user-uid-1',
          },
          'user-uid-1',
          expect.anything(),
        );
      });
    });
  });

  describe('findAll', () => {
    // Mock data for raw query result format
    const mockRawQueryResult = [
      {
        distance_val: 500,
        score: 1000,
        start_date: new Date('2023-01-10T14:00:00Z'),
        total_count: BigInt(2),
        uid: 'session-uid-1',
      },
      {
        distance_val: 1000,
        score: 900,
        start_date: new Date('2023-01-11T14:00:00Z'),
        total_count: BigInt(2),
        uid: 'session-uid-2',
      },
    ];

    const mockSessionsFromDb = [
      {
        creatorUid: 'user-uid-1',
        endDate: new Date('2023-01-10T16:00:00Z'),
        field: {
          fieldImages: [{ url: 'https://example.com/field1.jpg' }],
          latitude: 48.8566,
          longitude: 2.3522,
          shortAddress: '123 Main St, Paris',
        },
        gameMode: 'FIVE_V_FIVE',
        maxPlayersPerTeam: 5,
        sessionTeams: [
          { _count: { sessionPlayers: 3 }, teamName: 'Team A' },
          { _count: { sessionPlayers: 2 }, teamName: 'Team B' },
        ],
        sport: Sport.FOOTBALL,
        startDate: new Date('2023-01-10T14:00:00Z'),
        uid: 'session-uid-1',
      },
      {
        creatorUid: 'user-uid-2',
        endDate: new Date('2023-01-11T16:00:00Z'),
        field: {
          fieldImages: [],
          latitude: 48.8567,
          longitude: 2.3523,
          shortAddress: '456 Rue de Test, Paris',
        },
        gameMode: 'FIVE_V_FIVE',
        maxPlayersPerTeam: 5,
        sessionTeams: [
          { _count: { sessionPlayers: 4 }, teamName: 'Team A' },
          { _count: { sessionPlayers: 5 }, teamName: 'Team B' },
        ],
        sport: 'BASKETBALL',
        startDate: new Date('2023-01-11T14:00:00Z'),
        uid: 'session-uid-2',
      },
    ];

    it('should return a list of sessions when user has location', async () => {
      // Arrange
      const filter: FindAllSessionsDto = {
        limit: 10,
        userLat: 48.8566,
        userLon: 2.3522,
        userUid: 'user-uid-1',
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
        limit: 10,
        userUid: 'user-uid-1',
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
        cursor: '1',
        limit: 1,
        userLat: 48.8566,
        userLon: 2.3522,
        userUid: 'user-uid-1',
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
        limit: 1,
        userLat: 48.8566,
        userLon: 2.3522,
        userUid: 'user-uid-1',
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
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
        userUid: 'user-uid-1',
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
        endDate: new Date('2023-01-31T23:59:59Z'),
        startDate: new Date('2023-01-01T00:00:00Z'),
        userUid: 'user-uid-1',
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
        urgent: true,
        userLat: 48.8566,
        userLon: 2.3522,
        userUid: 'user-uid-1',
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
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      field: {
        fieldImages: [
          { order: 1, url: 'image1.jpg' },
          { order: 2, url: 'image2.jpg' },
        ],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris, France',
      },
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      maxPlayersPerTeam: 5,
      sessionTeams: [
        {
          sessionPlayers: [
            {
              teamUid: 'team-1',
              user: {
                firstname: 'John',
                imageUrl: 'user1.jpg',
                lastname: 'Doe',
              },
              userUid: 'user-1',
            },
          ],
          teamLabel: 'A',
          teamName: 'Team A',
        },
      ],
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      uid: 'session-uid-1',
      visibility: 'PUBLIC',
    };

    it('should return a session by uid', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);

      // Act
      const result = await service.findOne('session-uid-1');

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          fieldImages: expect.arrayContaining([
            expect.objectContaining({ order: 1 }),
            expect.objectContaining({ order: 2 }),
          ]),
          sessionTeams: expect.arrayContaining([
            expect.objectContaining({
              numberOfPlayers: 1,
              teamName: 'Team A',
            }),
          ]),
          uid: 'session-uid-1',
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

  describe('findOneWithDistance', () => {
    const mockSession = {
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      field: {
        fieldImages: [
          { order: 1, url: 'image1.jpg' },
          { order: 2, url: 'image2.jpg' },
        ],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris, France',
      },
      fieldLatitude: 48.8566,
      fieldLongitude: 2.3522,
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      maxPlayersPerTeam: 5,
      sessionTeams: [
        {
          sessionPlayers: [
            {
              teamUid: 'team-1',
              user: {
                firstname: 'John',
                imageUrl: 'user1.jpg',
                lastname: 'Doe',
              },
              userUid: 'user-1',
            },
          ],
          teamLabel: 'A',
          teamName: 'Team A',
        },
      ],
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      uid: 'session-uid-1',
      visibility: 'PUBLIC',
    };

    it('should return a session with user distance', async () => {
      // Arrange
      const userLatitude = 48.8584;
      const userLongitude = 2.2945;
      const userUid = 'user-uid-1';

      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);

      // Act
      const result = await service.findOneWithDistance(
        'session-uid-1',
        userUid,
        userLatitude,
        userLongitude,
      );

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          fieldLatitude: 48.8566,
          fieldLongitude: 2.3522,
          uid: 'session-uid-1',
          userDistance: expect.any(Number),
        }),
      );
      expect(result.userDistance).toBeGreaterThanOrEqual(0);
      expect(prismaService.sessions.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOneWithDistance('non-existent-uid', 'user-uid-1', 48.8584, 2.2945),
      ).rejects.toThrow(new NotFoundException('Session not found'));
    });

    it('should calculate correct distance based on coordinates', async () => {
      // Arrange
      const userLatitude = 48.8584; // Eiffel Tower coordinates
      const userLongitude = 2.2945;
      const userUid = 'user-uid-1';

      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);

      // Act
      const result = await service.findOneWithDistance(
        'session-uid-1',
        userUid,
        userLatitude,
        userLongitude,
      );

      // Assert
      // Distance between (48.8584, 2.2945) and (48.8566, 2.3522) should be around 3.8-4.5 km
      expect(result.userDistance).toBeGreaterThan(3.5);
      expect(result.userDistance).toBeLessThan(5);
    });

    it('should return zero distance when user is at the same location', async () => {
      // Arrange
      const userLatitude = 48.8566; // Same as field
      const userLongitude = 2.3522; // Same as field
      const userUid = 'user-uid-1';

      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);

      // Act
      const result = await service.findOneWithDistance(
        'session-uid-1',
        userUid,
        userLatitude,
        userLongitude,
      );

      // Assert
      expect(result.userDistance).toBe(0);
    });
  });

  describe('update', () => {
    const updateSessionDto: UpdateSessionDto = {
      description: 'Updated session',
      endDate: mockFutureEndDate.toISOString(),
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      startDate: mockFutureDate.toISOString(),
      teamsPerGame: 2,
      title: 'Updated Session Title',
    };

    const mockSessionForFindOne = {
      creatorUid: 'creator-uid-1',
      endDate: new Date('2023-01-10T16:00:00Z'),
      field: {
        fieldImages: [{ order: 1, url: 'image1.jpg' }],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris, France',
      },
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      level: SessionSportLevel.INTERMEDIATE,
      maxPlayersPerTeam: 5,
      sessionTeams: [
        {
          sessionPlayers: [],
          teamLabel: 'A',
          teamName: 'Team A',
        },
      ],
      sport: Sport.FOOTBALL,
      startDate: new Date('2023-01-10T14:00:00Z'),
      uid: 'session-uid-1',
      visibility: 'PUBLIC',
    };

    const mockField = {
      gameMode: '5v5',
      partnerUid: 'partner-uid-1',
      sports: [Sport.FOOTBALL],
      type: FieldType.PUBLIC,
      uid: 'field-uid-1',
    };

    const mockUpdatedSession = {
      createdAt: mockCurrentDate,
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
      uid: 'session-uid-1',
      updatedAt: mockCurrentDate,
    };

    it('should update a session successfully', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSessionForFindOne);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);
      (fieldsService.findOne as jest.Mock).mockResolvedValue(mockField);
      (prismaService.sessions.update as jest.Mock).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = await service.update('session-uid-1', updateSessionDto);

      // Assert
      expect(result).toBeUndefined();
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
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(3);
      (fieldsService.findOne as jest.Mock).mockResolvedValue(null);

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

  describe('findAllByUserUid', () => {
    const userUid = 'user-uid-1';
    const mockSession1 = {
      createdAt: new Date('2023-01-05T10:00:00Z'),
      creatorUid: userUid,
      description: 'Test session 1',
      endDate: mockFutureEndDate,
      field: {
        fieldImages: [{ url: 'image1.jpg' }],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
      },
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sessionTeams: [
        { _count: { sessionPlayers: 3 }, teamName: 'Team A' },
        { _count: { sessionPlayers: 2 }, teamName: 'Team B' },
      ],
      sport: Sport.FOOTBALL,
      startDate: mockFutureDate,
      teamsPerGame: 2,
      title: 'Test Session 1',
      uid: 'session-uid-1',
    };

    const mockSession2 = {
      createdAt: new Date('2023-01-06T10:00:00Z'),
      creatorUid: 'other-user-uid',
      description: 'Test session 2',
      endDate: new Date('2023-01-12T16:00:00Z'),
      field: {
        fieldImages: [{ url: 'image2.jpg' }],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
      },
      fieldUid: 'field-uid-2',
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sessionTeams: [
        { _count: { sessionPlayers: 4 }, teamName: 'Team A' },
        { _count: { sessionPlayers: 3 }, teamName: 'Team B' },
      ],
      sport: Sport.BASKETBALL,
      startDate: new Date('2023-01-12T14:00:00Z'),
      teamsPerGame: 2,
      title: 'Test Session 2',
      uid: 'session-uid-2',
    };

    const mockPastSession = {
      createdAt: new Date('2022-11-25T10:00:00Z'),
      creatorUid: userUid,
      description: 'Past session',
      endDate: new Date('2022-12-01T16:00:00Z'),
      field: {
        fieldImages: [{ url: 'image3.jpg' }],
        latitude: 48.8566,
        longitude: 2.3522,
        shortAddress: 'Paris',
      },
      fieldUid: 'field-uid-1',
      gameMode: GameModes.FIVE_V_FIVE,
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      sessionTeams: [
        { _count: { sessionPlayers: 5 }, teamName: 'Team A' },
        { _count: { sessionPlayers: 5 }, teamName: 'Team B' },
      ],
      sport: Sport.FOOTBALL,
      startDate: new Date('2022-12-01T14:00:00Z'),
      teamsPerGame: 2,
      title: 'Past Session',
      uid: 'session-uid-3',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return sessions where user is creator when ownership is CREATOR', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should return sessions where user is a player when ownership is PLAYER', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession2]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.PLAYER,
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { sessionPlayers: { some: { userUid } } },
      });
    });

    it('should return both creator and player sessions when ownership is not specified', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findAllByUserUid(userUid, {});

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          OR: [{ creatorUid: userUid }, { sessionPlayers: { some: { userUid } } }],
        },
      });
    });

    it('should filter sessions by minStart date', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession2]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      const _result = await service.findAllByUserUid(userUid, {
        minStart,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          startDate: { gte: minStart },
        },
      });
    });

    it('should filter sessions by maxStart date', async () => {
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      const _result = await service.findAllByUserUid(userUid, {
        maxStart,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          startDate: { lte: maxStart },
        },
      });
    });

    it('should filter sessions by date range (minStart and maxStart)', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        maxStart,
        minStart,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          startDate: { gte: minStart, lte: maxStart },
        },
      });
    });

    it('should filter sessions by endDate', async () => {
      const endDate = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        endDate,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          endDate: { lte: endDate },
        },
      });
    });

    it('should filter upcoming sessions when scope is UPCOMING', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        scope: SessionScope.UPCOMING,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.objectContaining({
          sport: true,
          startDate: true,
          uid: true,
        }),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          startDate: { gte: mockCurrentDate },
        },
      });
    });

    it('should filter past sessions when scope is PAST', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockPastSession]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        scope: SessionScope.PAST,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.objectContaining({
          sport: true,
          startDate: true,
          uid: true,
        }),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          startDate: { lt: mockCurrentDate },
        },
      });
    });

    it('should filter sessions by sports', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL],
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          sport: { in: [Sport.FOOTBALL] },
        },
      });
    });

    it('should filter sessions by multiple sports', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          sport: { in: [Sport.FOOTBALL, Sport.BASKETBALL] },
        },
      });
    });

    it('should sort sessions by startDate in ascending order', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'asc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ startDate: 'asc' }, { uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should sort sessions by startDate in descending order', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession2,
        mockSession1,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'desc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ startDate: 'desc' }, { uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should sort sessions by createdAt', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        createdAtSortOrder: 'desc',
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ createdAt: 'desc' }, { uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should sort sessions by multiple criteria', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([
        mockSession1,
        mockSession2,
      ]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(2);

      await service.findAllByUserUid(userUid, {
        createdAtSortOrder: 'desc',
        ownership: SessionOwnnership.CREATOR,
        startDateSortOrder: 'asc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }, { uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should apply multiple filters at once', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      const maxStart = new Date('2023-01-11T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        maxStart,
        minStart,
        ownership: SessionOwnnership.CREATOR,
        scope: SessionScope.UPCOMING,
        sports: [Sport.FOOTBALL],
        startDateSortOrder: 'asc',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ startDate: 'asc' }, { uid: 'asc' }],
        select: expect.objectContaining({
          sport: true,
          startDate: true,
          uid: true,
        }),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          sport: { in: [Sport.FOOTBALL] },
          startDate: { gte: mockCurrentDate, lte: maxStart },
        },
      });
    });

    it('should return empty array when no sessions found', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.nextCursor).toBeNull();
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: { creatorUid: userUid },
      });
    });

    it('should filter sessions by level', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        level: SessionSportLevel.BEGINNER,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          level: SessionSportLevel.BEGINNER,
        },
      });
    });

    it('should filter sessions by visibility', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        ownership: SessionOwnnership.CREATOR,
        visibility: 'PUBLIC',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          visibility: 'PUBLIC',
        },
      });
    });

    it('should handle pagination with cursor', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession2]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        cursor: 'session-uid-1',
        limit: 10,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: { uid: 'session-uid-1' },
        orderBy: [{ uid: 'asc' }],
        select: expect.any(Object),
        skip: 1,
        take: 11,
        where: {
          creatorUid: userUid,
        },
      });
    });

    it('should return nextCursor when more results are available', async () => {
      const moreSessions = Array(11)
        .fill(null)
        .map((_, i) => ({
          ...mockSession1,
          uid: `session-uid-${i}`,
        }));
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(moreSessions);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(20);

      const result = await service.findAllByUserUid(userUid, {
        limit: 10,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toHaveLength(10);
      expect(result.nextCursor).toBe('session-uid-10');
      expect(result.totalCount).toBe(20);
    });

    it('should return null nextCursor when no more results', async () => {
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAllByUserUid(userUid, {
        limit: 10,
        ownership: SessionOwnnership.CREATOR,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      expect(result.totalCount).toBe(1);
    });

    it('should combine level, visibility, and other filters', async () => {
      const minStart = new Date('2023-01-08T00:00:00Z');
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSession1]);
      (prismaService.sessions.count as jest.Mock).mockResolvedValue(1);

      await service.findAllByUserUid(userUid, {
        level: SessionSportLevel.INTERMEDIATE,
        minStart,
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL],
        startDateSortOrder: 'asc',
        visibility: 'PUBLIC',
      });

      expect(prismaService.sessions.findMany).toHaveBeenCalledWith({
        cursor: undefined,
        orderBy: [{ startDate: 'asc' }, { uid: 'asc' }],
        select: expect.any(Object),
        skip: 0,
        take: 11,
        where: {
          creatorUid: userUid,
          level: SessionSportLevel.INTERMEDIATE,
          sport: { in: [Sport.FOOTBALL] },
          startDate: { gte: minStart },
          visibility: 'PUBLIC',
        },
      });
    });
  });

  describe('getUserSessionStats', () => {
    it('should return organized and participated counts', async () => {
      const userUid = 'user-uid-1';
      (prismaService.sessions.count as jest.Mock)
        .mockResolvedValueOnce(5) // organized
        .mockResolvedValueOnce(10); // participated

      const result = await service.getUserSessionStats(userUid);

      expect(result).toEqual({ organizedCount: 5, participatedCount: 10 });
      expect(prismaService.sessions.count).toHaveBeenCalledWith({
        where: { creatorUid: userUid },
      });
      expect(prismaService.sessions.count).toHaveBeenCalledWith({
        where: {
          sessionPlayers: {
            some: {
              userUid: userUid,
            },
          },
        },
      });
    });
  });
});

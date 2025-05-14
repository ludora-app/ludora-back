import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatDate, timeStringToMinutes } from 'src/shared/utils/date.utils';
import { transformSnakeToCamel } from 'src/shared/utils/snake-to-camel-case.util';
import { SessionsService } from './../../src/sessions/sessions.service';
import { CreateSessionDto } from '../../src/sessions/dto/input/create-session.dto';
import { UpdateSessionDto } from '../../src/sessions/dto/input/update-session.dto';
import { SessionFilterDto } from '../../src/sessions/dto/input/session-filter.dto';
import { Sport } from 'src/shared/constants/constants';
import { Game_modes } from '@prisma/client';

// Mock the utility functions
jest.mock('src/shared/utils/date.utils', () => ({
  formatDate: jest.fn().mockReturnValue('2023-01-01'),
  timeStringToMinutes: jest.fn().mockImplementation((time) => {
    if (time === '08:00:00') return 480; // 8 hours * 60 minutes
    if (time === '22:00:00') return 1320; // 22 hours * 60 minutes
    if (time === '16:00:00') return 960; // 16 hours * 60 minutes
    return 0;
  }),
}));

jest.mock('src/shared/utils/snake-to-camel-case.util', () => ({
  transformSnakeToCamel: jest.fn().mockImplementation((_, data) => {
    if (Array.isArray(data)) {
      return data.map((item) => ({
        ...item,
        endDate: item.end_date,
        startDate: item.start_date,
        maxPlayersPerTeam: item.max_players_per_team,
        minPlayersPerTeam: item.min_players_per_team,
        teamsPerGame: item.teams_per_game,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    }
    return {
      ...data,
      endDate: data.end_date,
      startDate: data.start_date,
      maxPlayersPerTeam: data.max_players_per_team,
      minPlayersPerTeam: data.min_players_per_team,
      teamsPerGame: data.teams_per_game,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }),
}));

describe('SessionsService', () => {
  let service: SessionsService;
  let prismaService: PrismaService;

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
            fields: {
              findUnique: jest.fn(),
            },
            partner_opening_hours: {
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
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prismaService = module.get<PrismaService>(PrismaService);
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
      fieldId: 'field-id-1',
      startDate: mockFutureDate.toISOString(),
      description: 'Test session',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      title: 'Test Session Title',
      gameMode: Game_modes.FIVE_V_FIVE,
    };

    const mockField = {
      id: 'field-id-1',
      sport: Sport.FOOTBALL,
      game_mode: '5v5',
      partner_id: 'partner-id-1',
    };

    const mockOpeningHours = {
      partner_id: 'partner-id-1',
      day_of_week: 2, // Tuesday
      open_time: '08:00:00',
      close_time: '22:00:00',
      is_closed: false,
    };

    const mockCreatedSession = {
      id: 'session-id-1',
      description: 'Test session',
      end_date: mockFutureEndDate,
      field_id: 'field-id-1',
      game_mode: '5v5',
      max_players_per_team: 5,
      min_players_per_team: 3,
      sport: Sport.FOOTBALL,
      start_date: mockFutureDate,
      teams_per_game: 2,
      title: 'Test Session Title',
      created_at: mockCurrentDate,
      updated_at: mockCurrentDate,
    };

    it('should create a session successfully', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessions.create as jest.Mock).mockResolvedValue(mockCreatedSession);

      // Act
      const result = await service.create(createSessionDto);

      // Assert
      expect(result).toEqual({
        data: expect.objectContaining({
          id: 'session-id-1',
          title: 'Test Session Title',
        }),
        message: 'Session created successfully',
        status: 201,
      });
      expect(prismaService.fields.findUnique).toHaveBeenCalledWith({
        where: { id: 'field-id-1' },
      });
      expect(prismaService.sessions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          field_id: 'field-id-1',
          title: 'Test Session Title',
        }),
      });
    });

    it('should auto-generate a title if none provided', async () => {
      // Arrange
      const dtoWithoutTitle = { ...createSessionDto, title: undefined };
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sessions.create as jest.Mock).mockResolvedValue({
        ...mockCreatedSession,
        title: `Session de FOOTBALL le 2023-01-01`,
      });

      // Act
      await service.create(dtoWithoutTitle);

      // Assert
      expect(formatDate).toHaveBeenCalledWith(mockFutureDate.toISOString());
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

    it('should throw BadRequestException if field is closed on the date', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue({
        ...mockOpeningHours,
        is_closed: true,
      });

      // Act & Assert
      await expect(service.create(createSessionDto)).rejects.toThrow(
        new BadRequestException('The field is closed on this date'),
      );
    });

    it('should throw BadRequestException if session is outside opening hours', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue({
        ...mockOpeningHours,
        open_time: '16:00:00', // After session start time
      });
      (timeStringToMinutes as jest.Mock).mockReturnValueOnce(960); // 16 * 60

      // Act & Assert
      await expect(service.create(createSessionDto)).rejects.toThrow(
        new BadRequestException('The session is outside the opening hours of the field'),
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
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );

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
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );

      // Act & Assert
      await expect(service.create(invalidDateSessionDto)).rejects.toThrow(
        new BadRequestException('The end date must be after the start date'),
      );
    });

    it('should throw BadRequestException if there is a session conflict', async () => {
      // Arrange
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );
      (prismaService.sessions.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-session-id',
      });

      // Act & Assert
      await expect(service.create(createSessionDto)).rejects.toThrow(
        new BadRequestException('Another session is already scheduled at this time on this field'),
      );
    });
  });

  describe('findAll', () => {
    const mockSessions = [
      {
        id: 'session-id-1',
        description: 'Session 1',
        end_date: new Date('2023-01-10T16:00:00Z'),
        start_date: new Date('2023-01-10T14:00:00Z'),
        sport: Sport.FOOTBALL,
        title: 'Session 1 Title',
        max_players_per_team: 5,
        min_players_per_team: 3,
        teams_per_game: 2,
        created_at: new Date('2023-01-01T12:00:00Z'),
        updated_at: new Date('2023-01-01T12:00:00Z'),
      },
      {
        id: 'session-id-2',
        description: 'Session 2',
        end_date: new Date('2023-01-11T16:00:00Z'),
        start_date: new Date('2023-01-11T14:00:00Z'),
        sport: 'BASKETBALL',
        title: 'Session 2 Title',
        max_players_per_team: 5,
        min_players_per_team: 3,
        teams_per_game: 2,
        created_at: new Date('2023-01-01T12:00:00Z'),
        updated_at: new Date('2023-01-01T12:00:00Z'),
      },
    ];

    it('should return a list of sessions', async () => {
      // Arrange
      const filter: SessionFilterDto = { limit: 10 };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result).toEqual({
        data: {
          items: expect.arrayContaining([
            expect.objectContaining({ id: 'session-id-1' }),
            expect.objectContaining({ id: 'session-id-2' }),
          ]),
          nextCursor: null,
          totalCount: 2,
        },
        message: 'Sessions fetched successfully',
        status: 200,
      });
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11, // limit + 1
          where: {},
        }),
      );
    });

    it('should handle pagination with cursor', async () => {
      // Arrange
      const filter: SessionFilterDto = { limit: 1, cursor: 'session-id-1' };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue([mockSessions[1]]);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.data.items).toHaveLength(1);
      expect(result.data.nextCursor).toBeNull();
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'session-id-1' },
          skip: 1,
          take: 2,
        }),
      );
    });

    it('should return the next cursor when more results exist', async () => {
      // Arrange
      const filter: SessionFilterDto = { limit: 1 };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      const result = await service.findAll(filter);

      // Assert
      expect(result.data.items).toHaveLength(1);
      expect(result.data.nextCursor).toBe('session-id-2');
    });

    it('should filter by scope UPCOMING', async () => {
      // Arrange
      const filter: SessionFilterDto = { scope: 'UPCOMING' };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      await service.findAll(filter);

      // Assert
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            start_date: { gte: mockCurrentDate },
          },
        }),
      );
    });

    it('should filter by scope PAST', async () => {
      // Arrange
      const filter: SessionFilterDto = { scope: 'PAST' };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      await service.findAll(filter);

      // Assert
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            start_date: { lt: mockCurrentDate },
          },
        }),
      );
    });

    it('should filter by sports', async () => {
      // Arrange
      const filter: SessionFilterDto = { sports: [Sport.FOOTBALL, Sport.BASKETBALL] };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      await service.findAll(filter);

      // Assert
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sport: { in: [Sport.FOOTBALL, 'BASKETBALL'] },
          },
        }),
      );
    });

    it('should filter by min and max start date', async () => {
      // Arrange
      const minStart = new Date('2023-01-01T00:00:00Z');
      const maxStart = new Date('2023-01-31T23:59:59Z');
      const filter: SessionFilterDto = {
        minStart,
        maxStart,
      };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      await service.findAll(filter);

      // Assert
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            start_date: {
              gte: minStart,
              lte: maxStart,
            },
          },
        }),
      );
    });

    it('should add location filtering when coordinates provided', async () => {
      // Arrange
      const filter: SessionFilterDto = {
        latitude: 45.5,
        longitude: -73.6,
        maxDistance: 10,
      };
      (prismaService.sessions.findMany as jest.Mock).mockResolvedValue(mockSessions);

      // Act
      await service.findAll(filter);

      // Assert
      expect(prismaService.sessions.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            distance: {
              from: { latitude: 45.5, longitude: -73.6 },
              to: { latitude: 45.5, longitude: -73.6 },
            },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockSession = {
      id: 'session-id-1',
      description: 'Test session',
      end_date: new Date('2023-01-10T16:00:00Z'),
      field_id: 'field-id-1',
      game_mode: '5v5',
      max_players_per_team: 5,
      min_players_per_team: 3,
      sport: Sport.FOOTBALL,
      start_date: new Date('2023-01-10T14:00:00Z'),
      teams_per_game: 2,
      title: 'Test Session Title',
      created_at: new Date('2023-01-01T12:00:00Z'),
      updated_at: new Date('2023-01-01T12:00:00Z'),
    };

    it('should return a session by id', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);

      // Act
      const result = await service.findOne('session-id-1');

      // Assert
      expect(result).toEqual({
        data: expect.objectContaining({
          id: 'session-id-1',
        }),
        message: 'Session fetched successfully',
        status: 200,
      });
      expect(prismaService.sessions.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-id-1' },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Session not found'),
      );
    });
  });

  describe('update', () => {
    const updateSessionDto: UpdateSessionDto = {
      endDate: mockFutureEndDate.toISOString(),
      startDate: mockFutureDate.toISOString(),
      description: 'Updated session',
      gameMode: Game_modes.FIVE_V_FIVE,
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      teamsPerGame: 2,
      title: 'Updated Session Title',
    };

    const mockSession = {
      id: 'session-id-1',
      field_id: 'field-id-1',
    };

    const mockField = {
      id: 'field-id-1',
      sport: Sport.FOOTBALL,
      game_mode: '5v5',
      partner_id: 'partner-id-1',
    };

    const mockOpeningHours = {
      partner_id: 'partner-id-1',
      day_of_week: 2, // Tuesday
      open_time: '08:00:00',
      close_time: '22:00:00',
      is_closed: false,
    };

    const mockUpdatedSession = {
      id: 'session-id-1',
      description: 'Updated session',
      end_date: mockFutureEndDate,
      field_id: 'field-id-1',
      game_mode: '5v5',
      max_players_per_team: 6,
      min_players_per_team: 4,
      sport: Sport.FOOTBALL,
      start_date: mockFutureDate,
      teams_per_game: 2,
      title: 'Updated Session Title',
      created_at: mockCurrentDate,
      updated_at: mockCurrentDate,
    };

    it('should update a session successfully', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue(
        mockOpeningHours,
      );
      (prismaService.sessions.update as jest.Mock).mockResolvedValue(mockUpdatedSession);

      // Act
      const result = await service.update('session-id-1', updateSessionDto);

      // Assert
      expect(result).toEqual({
        data: expect.objectContaining({
          id: 'session-id-1',
          title: 'Updated Session Title',
        }),
        message: 'Session updated successfully',
        status: 200,
      });
      expect(prismaService.sessions.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Updated Session Title',
        }),
        where: { id: 'session-id-1' },
      });
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent-id', updateSessionDto)).rejects.toThrow(
        new NotFoundException('Session not found'),
      );
    });

    it('should throw NotFoundException if field not found', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('session-id-1', updateSessionDto)).rejects.toThrow(
        new NotFoundException('Field not found'),
      );
    });

    it('should throw BadRequestException if field is closed on the date', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue({
        ...mockOpeningHours,
        is_closed: true,
      });

      // Act & Assert
      await expect(service.update('session-id-1', updateSessionDto)).rejects.toThrow(
        new BadRequestException('The field is closed on this date'),
      );
    });

    it('should throw BadRequestException if session is outside opening hours', async () => {
      // Arrange
      (prismaService.sessions.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prismaService.fields.findUnique as jest.Mock).mockResolvedValue(mockField);
      (prismaService.partner_opening_hours.findUnique as jest.Mock).mockResolvedValue({
        ...mockOpeningHours,
        open_time: '16:00:00', // After session start time
      });
      (timeStringToMinutes as jest.Mock).mockReturnValueOnce(960); // 16 * 60

      // Act & Assert
      await expect(service.update('session-id-1', updateSessionDto)).rejects.toThrow(
        new BadRequestException('The session is outside the opening hours of the field'),
      );
    });
  });

  describe('remove', () => {
    it('should return a string message', () => {
      const result = service.remove(1);
      expect(result).toBe('This action removes a #1 session');
    });
  });
});

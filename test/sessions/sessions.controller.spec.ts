import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Game_modes } from '@prisma/client';
import { CreateSessionDto } from 'src/sessions/dto/input/create-session.dto';
import { SessionFilterDto } from 'src/sessions/dto/input/session-filter.dto';
import { UpdateSessionDto } from 'src/sessions/dto/input/update-session.dto';
import { SessionTeamsService } from 'src/sessions/session-teams.service';
import { SessionsController } from 'src/sessions/sessions.controller';
import { SessionsService } from 'src/sessions/sessions.service';
import { Sport } from 'src/shared/constants/constants';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSessionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSessionTeamsService = {
    createDefaultTeams: jest.fn(),
    findTeamsBySessionUid: jest.fn(),
    findOneByUid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: SessionTeamsService,
          useValue: mockSessionTeamsService,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createSessionDto: CreateSessionDto = {
      endDate: '2023-02-15T16:00:00Z',
      fieldId: 'field-id-1',
      startDate: '2023-02-15T14:00:00Z',
      description: 'Test session',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      title: 'Test Session Title',
      gameMode: Game_modes.FIVE_V_FIVE,
    };

    it('should create a session', async () => {
      const createdSession = {
        id: 'session-id-1',
        title: 'Test Session Title',
        sport: Sport.FOOTBALL,
        description: 'Test session',
        gameMode: Game_modes.FIVE_V_FIVE,
        startDate: '2023-02-15T14:00:00Z',
        endDate: '2023-02-15T16:00:00Z',
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
      };

      mockSessionsService.create.mockResolvedValue(createdSession);

      const result = await controller.create(createSessionDto);

      expect(result).toEqual({
        data: createdSession,
        message: 'Session created successfully',
        status: 201,
      });
      expect(service.create).toHaveBeenCalledWith(createSessionDto);
    });

    it('should propagate errors from service', async () => {
      const errorMessage = 'Field not found';
      mockSessionsService.create.mockRejectedValue(new BadRequestException(errorMessage));

      await expect(controller.create(createSessionDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createSessionDto);
    });
  });

  describe('findAll', () => {
    const sessionFilterDto: SessionFilterDto = {
      limit: 10,
      sports: [Sport.FOOTBALL],
    };

    it('should return all sessions with filters', async () => {
      const sessionsData = {
        items: [
          {
            id: 'session-id-1',
            title: 'Test Session 1',
            sport: Sport.FOOTBALL,
            startDate: '2023-02-15T14:00:00Z',
            endDate: '2023-02-15T16:00:00Z',
          },
          {
            id: 'session-id-2',
            title: 'Test Session 2',
            sport: Sport.FOOTBALL,
            startDate: '2023-02-16T14:00:00Z',
            endDate: '2023-02-16T16:00:00Z',
          },
        ],
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAll.mockResolvedValue(sessionsData);

      const result = await controller.findAll(sessionFilterDto);

      expect(result).toEqual({
        data: sessionsData,
        message: 'Sessions fetched successfully',
        status: 200,
      });
      expect(service.findAll).toHaveBeenCalledWith(sessionFilterDto);
    });

    it('should work with pagination', async () => {
      const paginatedFilter: SessionFilterDto = {
        ...sessionFilterDto,
        limit: 1,
        cursor: 'session-id-1',
      };

      const paginatedData = {
        items: [
          {
            id: 'session-id-2',
            title: 'Test Session 2',
            sport: Sport.FOOTBALL,
            startDate: '2023-02-16T14:00:00Z',
            endDate: '2023-02-16T16:00:00Z',
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockSessionsService.findAll.mockResolvedValue(paginatedData);

      const result = await controller.findAll(paginatedFilter);

      expect(result).toEqual({
        data: paginatedData,
        message: 'Sessions fetched successfully',
        status: 200,
      });
      expect(service.findAll).toHaveBeenCalledWith(paginatedFilter);
    });
  });

  describe('findOne', () => {
    const sessionId = 'session-id-1';

    it('should return a session by id', async () => {
      const sessionData = {
        id: sessionId,
        title: 'Test Session',
        sport: Sport.FOOTBALL,
        description: 'Test session',
        gameMode: Game_modes.FIVE_V_FIVE,
        startDate: '2023-02-15T14:00:00Z',
        endDate: '2023-02-15T16:00:00Z',
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
      };

      mockSessionsService.findOne.mockResolvedValue(sessionData);

      const result = await controller.findOne(sessionId);

      expect(result).toEqual({
        data: sessionData,
        message: 'Session fetched successfully',
        status: 200,
      });
      expect(service.findOne).toHaveBeenCalledWith(sessionId);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockSessionsService.findOne.mockRejectedValue(new NotFoundException('Session not found'));

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    const sessionId = 'session-id-1';
    const updateSessionDto: UpdateSessionDto = {
      endDate: '2023-02-15T17:00:00Z',
      startDate: '2023-02-15T15:00:00Z',
      description: 'Updated session',
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      teamsPerGame: 2,
      title: 'Updated Session Title',
      gameMode: Game_modes.FIVE_V_FIVE,
    };

    it('should update a session', async () => {
      const updatedSessionData = {
        id: sessionId,
        title: 'Updated Session Title',
        sport: Sport.FOOTBALL,
        description: 'Updated session',
        gameMode: Game_modes.FIVE_V_FIVE,
        startDate: '2023-02-15T15:00:00Z',
        endDate: '2023-02-15T17:00:00Z',
        maxPlayersPerTeam: 6,
        minPlayersPerTeam: 4,
        teamsPerGame: 2,
      };

      mockSessionsService.update.mockResolvedValue(updatedSessionData);

      const result = await controller.update(sessionId, updateSessionDto);

      expect(result).toEqual({
        data: updatedSessionData,
        message: 'Session updated successfully',
        status: 200,
      });
      expect(service.update).toHaveBeenCalledWith(sessionId, updateSessionDto);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockSessionsService.update.mockRejectedValue(new NotFoundException('Session not found'));

      await expect(controller.update('non-existent-id', updateSessionDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith('non-existent-id', updateSessionDto);
    });

    it('should throw BadRequestException when validation fails', async () => {
      mockSessionsService.update.mockRejectedValue(
        new BadRequestException('The field is closed on this date'),
      );

      await expect(controller.update(sessionId, updateSessionDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith(sessionId, updateSessionDto);
    });
  });

  describe('remove', () => {
    it('should remove a session', async () => {
      const sessionId = '1';
      const mockResponse = 'This action removes a #1 session';

      mockSessionsService.remove.mockReturnValue(mockResponse);

      const result = await controller.remove(sessionId);

      expect(result).toBe(mockResponse);
      expect(service.remove).toHaveBeenCalledWith(1); // Note: Controller converts to number
    });
  });
});

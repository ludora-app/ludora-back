import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GameModes } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import {
  CreateSessionDto,
  CreateSessionFromRequestDto,
} from 'src/sessions/dto/input/create-session.dto';
import { FindAllSessionsDto } from 'src/sessions/dto/input/session-filter.dto';
import { UpdateSessionDto } from 'src/sessions/dto/input/update-session.dto';
import { SessionsController } from 'src/sessions/controllers/sessions.controller';
import { SessionScope, Sport } from 'src/shared/constants/constants';
import { SessionsService } from 'src/sessions/services/sessions.service';
import {
  MySessionFilterDto,
  SessionOwnnership,
} from 'src/sessions/dto/input/my-session-filter.dto';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: SessionsService;

  const mockSessionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByUserUid: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSessionTeamsService = {
    createDefaultTeams: jest.fn(),
    findTeamsBySessionUid: jest.fn(),
    findOneByUid: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
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
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

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
    const createSessionDto: CreateSessionFromRequestDto = {
      endDate: '2023-02-15T16:00:00Z',
      fieldUid: 'field-uid-1',
      startDate: '2023-02-15T14:00:00Z',
      description: 'Test session',
      maxPlayersPerTeam: 5,
      minPlayersPerTeam: 3,
      teamsPerGame: 2,
      title: 'Test Session Title',
      gameMode: GameModes.FIVE_V_FIVE,
    };

    const mockRequest = {
      user: {
        uid: 'user-uid-1',
      },
    } as any;

    const createSessionWithUserDto: CreateSessionDto = {
      ...createSessionDto,
      userUid: 'user-uid-1',
    };

    it('should create a session', async () => {
      const createdSession = {
        uid: 'session-uid-1',
        title: 'Test Session Title',
        sport: Sport.FOOTBALL,
        description: 'Test session',
        gameMode: GameModes.FIVE_V_FIVE,
        startDate: '2023-02-15T14:00:00Z',
        endDate: '2023-02-15T16:00:00Z',
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
      };

      mockSessionsService.create.mockResolvedValue(createdSession);

      const result = await controller.create(createSessionDto, mockRequest);

      expect(result).toEqual({
        data: expect.objectContaining({
          uid: 'session-uid-1',
          title: 'Test Session Title',
          sport: Sport.FOOTBALL,
        }),
        message: 'Session created successfully',
      });
      expect(service.create).toHaveBeenCalledWith(createSessionWithUserDto);
    });

    it('should propagate errors from service', async () => {
      const errorMessage = 'Field not found';
      mockSessionsService.create.mockRejectedValue(new BadRequestException(errorMessage));

      await expect(controller.create(createSessionDto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.create).toHaveBeenCalledWith(createSessionWithUserDto);
    });
  });

  describe('findAll', () => {
    const mockRequest = {
      user: {
        uid: 'user-uid-1',
      },
    } as any;

    const sessionFilterDto: FindAllSessionsDto = {
      userUid: 'user-uid-1',
      limit: 10,
      sports: [Sport.FOOTBALL],
    };

    it('should return all sessions with filters', async () => {
      const sessionsData = {
        items: [
          {
            uid: 'session-uid-1',
            title: 'Test Session 1',
            sport: Sport.FOOTBALL,
            startDate: '2023-02-15T14:00:00Z',
            endDate: '2023-02-15T16:00:00Z',
          },
          {
            uid: 'session-uid-2',
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

      const result = await controller.findAll(mockRequest, sessionFilterDto);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAll).toHaveBeenCalledWith({
        userUid: 'user-uid-1',
        ...sessionFilterDto,
      });
    });

    it('should work with pagination', async () => {
      const paginatedFilter: FindAllSessionsDto = {
        ...sessionFilterDto,
        limit: 1,
        cursor: 'session-uid-1',
      };

      const paginatedData = {
        items: [
          {
            uid: 'session-uid-2',
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

      const result = await controller.findAll(mockRequest, paginatedFilter);

      expect(result).toEqual({
        data: {
          items: paginatedData.items,
          nextCursor: paginatedData.nextCursor,
          totalCount: paginatedData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAll).toHaveBeenCalledWith({
        userUid: 'user-uid-1',
        ...paginatedFilter,
      });
    });
  });

  describe('findOne', () => {
    const sessionUid = 'session-uid-1';

    it('should return a session by uid', async () => {
      const sessionData = {
        uid: sessionUid,
        title: 'Test Session',
        sport: Sport.FOOTBALL,
        description: 'Test session',
        gameMode: GameModes.FIVE_V_FIVE,
        startDate: '2023-02-15T14:00:00Z',
        endDate: '2023-02-15T16:00:00Z',
        maxPlayersPerTeam: 5,
        minPlayersPerTeam: 3,
        teamsPerGame: 2,
      };

      mockSessionsService.findOne.mockResolvedValue(sessionData);

      const result = await controller.findOne(sessionUid);

      expect(result).toEqual({
        data: sessionData,
        message: 'Session fetched successfully',
      });
      expect(service.findOne).toHaveBeenCalledWith(sessionUid);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockSessionsService.findOne.mockRejectedValue(new NotFoundException('Session not found'));

      await expect(controller.findOne('non-existent-uid')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-uid');
    });
  });

  describe('update', () => {
    const sessionUid = 'session-uid-1';
    const updateSessionDto: UpdateSessionDto = {
      endDate: '2023-02-15T17:00:00Z',
      startDate: '2023-02-15T15:00:00Z',
      description: 'Updated session',
      maxPlayersPerTeam: 6,
      minPlayersPerTeam: 4,
      teamsPerGame: 2,
      title: 'Updated Session Title',
      gameMode: GameModes.FIVE_V_FIVE,
    };

    it('should update a session and return no content (204)', async () => {
      const updatedSessionData = {
        uid: sessionUid,
        title: 'Updated Session Title',
        sport: Sport.FOOTBALL,
        description: 'Updated session',
        gameMode: GameModes.FIVE_V_FIVE,
        startDate: '2023-02-15T15:00:00Z',
        endDate: '2023-02-15T17:00:00Z',
        maxPlayersPerTeam: 6,
        minPlayersPerTeam: 4,
        teamsPerGame: 2,
      };

      mockSessionsService.update.mockResolvedValue(updatedSessionData);

      const result = await controller.update(sessionUid, updateSessionDto);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith(sessionUid, updateSessionDto);
    });

    it('should throw NotFoundException when session not found', async () => {
      mockSessionsService.update.mockRejectedValue(new NotFoundException('Session not found'));

      await expect(controller.update('non-existent-uid', updateSessionDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith('non-existent-uid', updateSessionDto);
    });

    it('should throw BadRequestException when validation fails', async () => {
      mockSessionsService.update.mockRejectedValue(
        new BadRequestException('The field is closed on this date'),
      );

      await expect(controller.update(sessionUid, updateSessionDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.update).toHaveBeenCalledWith(sessionUid, updateSessionDto);
    });
  });

  describe('findAllByUserUid', () => {
    const mockRequest = {
      user: {
        uid: 'user-uid-1',
      },
    } as any;

    const mockSessionCollectionItems = [
      {
        uid: 'session-uid-1',
        title: 'Test Session 1',
        sport: Sport.FOOTBALL,
        startDate: '2023-02-15T14:00:00Z',
        endDate: '2023-02-15T16:00:00Z',
        field: {
          latitude: 48.8566,
          longitude: 2.3522,
          shortAddress: 'Paris',
        },
        teams: [
          { teamName: 'Team A', playersCount: 3 },
          { teamName: 'Team B', playersCount: 2 },
        ],
      },
      {
        uid: 'session-uid-2',
        title: 'Test Session 2',
        sport: Sport.BASKETBALL,
        startDate: '2023-02-16T14:00:00Z',
        endDate: '2023-02-16T16:00:00Z',
        field: {
          latitude: 48.8566,
          longitude: 2.3522,
          shortAddress: 'Paris',
        },
        teams: [
          { teamName: 'Team A', playersCount: 4 },
          { teamName: 'Team B', playersCount: 3 },
        ],
      },
    ];

    it('should return sessions created by the user when ownership is CREATOR', async () => {
      const filters: MySessionFilterDto = {
        ownership: SessionOwnnership.CREATOR,
      };

      const sessionsData = {
        items: [mockSessionCollectionItems[0]],
        nextCursor: null,
        totalCount: 1,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should return sessions where user is a player when ownership is PLAYER', async () => {
      const filters: MySessionFilterDto = {
        ownership: SessionOwnnership.PLAYER,
      };

      const sessionsData = {
        items: [mockSessionCollectionItems[1]],
        nextCursor: null,
        totalCount: 1,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should return both creator and player sessions when ownership is not specified', async () => {
      const filters: MySessionFilterDto = {};

      const sessionsData = {
        items: mockSessionCollectionItems,
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should filter sessions by date range', async () => {
      const filters: MySessionFilterDto = {
        minStart: new Date('2023-02-15T00:00:00Z'),
        maxStart: new Date('2023-02-16T00:00:00Z'),
      };

      const sessionsData = {
        items: mockSessionCollectionItems,
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should filter sessions by scope UPCOMING', async () => {
      const filters: MySessionFilterDto = {
        scope: SessionScope.UPCOMING,
      };

      const sessionsData = {
        items: mockSessionCollectionItems,
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should filter sessions by scope PAST', async () => {
      const filters: MySessionFilterDto = {
        scope: SessionScope.PAST,
      };

      const sessionsData = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should filter sessions by sports', async () => {
      const filters: MySessionFilterDto = {
        sports: [Sport.FOOTBALL],
      };

      const sessionsData = {
        items: [mockSessionCollectionItems[0]],
        nextCursor: null,
        totalCount: 1,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should sort sessions by startDate', async () => {
      const filters: MySessionFilterDto = {
        startDateSortOrder: 'desc',
      };

      const sessionsData = {
        items: mockSessionCollectionItems.reverse(),
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should sort sessions by createdAt', async () => {
      const filters: MySessionFilterDto = {
        createdAtSortOrder: 'asc',
      };

      const sessionsData = {
        items: mockSessionCollectionItems,
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should apply multiple filters and sorting', async () => {
      const filters: MySessionFilterDto = {
        ownership: SessionOwnnership.CREATOR,
        sports: [Sport.FOOTBALL, Sport.BASKETBALL],
        scope: SessionScope.UPCOMING,
        startDateSortOrder: 'asc',
      };

      const sessionsData = {
        items: mockSessionCollectionItems,
        nextCursor: null,
        totalCount: 2,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: sessionsData.items,
          nextCursor: sessionsData.nextCursor,
          totalCount: sessionsData.totalCount,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });

    it('should return empty array when no sessions found', async () => {
      const filters: MySessionFilterDto = {
        ownership: SessionOwnnership.CREATOR,
      };

      const sessionsData = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockSessionsService.findAllByUserUid.mockResolvedValue(sessionsData);

      const result = await controller.findAllByUserUid(mockRequest, filters);

      expect(result).toEqual({
        data: {
          items: [],
          nextCursor: null,
          totalCount: 0,
        },
        message: 'Sessions fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1', filters);
    });
  });

  describe('remove', () => {
    it('should remove a session', async () => {
      const sessionUid = 'session-uid-1';
      const mockResponse = 'This action removes a #1 session';

      mockSessionsService.remove.mockReturnValue(mockResponse);

      const result = await controller.remove(sessionUid);

      expect(result).toBe(mockResponse);
      expect(service.remove).toHaveBeenCalledWith('session-uid-1');
    });
  });
});

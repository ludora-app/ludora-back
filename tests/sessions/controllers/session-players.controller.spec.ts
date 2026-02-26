import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionPlayersController } from 'src/sessions/controllers/session-players.controller';
import { JoinSessionDto } from 'src/sessions/dto/input/create-session-player.dto';
import { SessionsPipe } from 'src/sessions/pipes/sessions.pipe';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionsService } from 'src/sessions/services/sessions.service';

describe('SessionPlayersController', () => {
  let controller: SessionPlayersController;
  let sessionsService: SessionsService;
  let playersService: SessionPlayersService;

  const mockSessionsService = {
    joinSession: jest.fn(),
  };

  const mockPlayersService = {
    suggestPlayerFromPreviousSessions: jest.fn(),
    leaveSession: jest.fn(),
    switchPlayerToAnotherTeam: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPrismaService = {
    sessions: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionPlayersController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: SessionPlayersService,
          useValue: mockPlayersService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        SessionsPipe,
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionPlayersController>(SessionPlayersController);
    sessionsService = module.get<SessionsService>(SessionsService);
    playersService = module.get<SessionPlayersService>(SessionPlayersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('joinSession', () => {
    const mockJoinSessionDto: JoinSessionDto = {
      sessionUid: 'session-uid-123',
      teamUid: 'team-uid-456',
    };

    const mockRequest = {
      user: {
        uid: 'user-uid-789',
      },
    } as any;

    const mockNewPlayer = {
      uid: 'player-uid-101',
      sessionUid: 'session-uid-123',
      teamUid: 'team-uid-456',
      userUid: 'user-uid-789',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully join a session and return the new player', async () => {
      mockSessionsService.joinSession.mockResolvedValue(mockNewPlayer);

      const result = await controller.joinSession(mockRequest, mockJoinSessionDto);

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
      expect(result).toEqual({
        data: mockNewPlayer,
        message: 'Player joined session successfully',
      });
    });

    it('should pass the correct userUid from the request to the service', async () => {
      mockSessionsService.joinSession.mockResolvedValue(mockNewPlayer);

      await controller.joinSession(mockRequest, mockJoinSessionDto);

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        sessionUid: mockJoinSessionDto.sessionUid,
        teamUid: mockJoinSessionDto.teamUid,
        userUid: 'user-uid-789',
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionsService.joinSession.mockRejectedValue(
        new NotFoundException(`Session ${mockJoinSessionDto.sessionUid} not found`),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockSessionsService.joinSession.mockRejectedValue(
        new NotFoundException(`Team ${mockJoinSessionDto.teamUid} not found`),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw BadRequestException when session and team do not match', async () => {
      mockSessionsService.joinSession.mockRejectedValue(
        new BadRequestException(
          `Session ${mockJoinSessionDto.sessionUid} and team ${mockJoinSessionDto.teamUid} do not match`,
        ),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw BadRequestException when player already exists in session', async () => {
      mockSessionsService.joinSession.mockRejectedValue(
        new BadRequestException(
          `Player ${mockRequest.user.uid} already in session ${mockJoinSessionDto.sessionUid}`,
        ),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(sessionsService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });
  });

  describe('suggestPlayerFromPreviousSessions', () => {
    const mockRequest = {
      user: { uid: 'user-uid-123' },
    } as any;

    const mockPaginatedSuggestions = {
      items: [
        {
          uid: 'suggested-uid-1',
          firstname: 'Jean',
          lastname: 'Dupont',
          imageUrl: 'https://example.com/avatar.jpg',
        },
      ],
      nextCursor: null,
      totalCount: 1,
    };

    it('should return suggested players with success message', async () => {
      mockPlayersService.suggestPlayerFromPreviousSessions.mockResolvedValue(
        mockPaginatedSuggestions,
      );

      const result = await controller.suggestPlayerFromPreviousSessions(mockRequest);

      expect(playersService.suggestPlayerFromPreviousSessions).toHaveBeenCalledWith(
        mockRequest.user.uid,
      );
      expect(result).toEqual({
        data: mockPaginatedSuggestions,
        message: 'Players suggested successfully',
      });
    });

    it('should pass userUid from request to the service', async () => {
      mockPlayersService.suggestPlayerFromPreviousSessions.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.suggestPlayerFromPreviousSessions(mockRequest);

      expect(playersService.suggestPlayerFromPreviousSessions).toHaveBeenCalledWith('user-uid-123');
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Database error');
      mockPlayersService.suggestPlayerFromPreviousSessions.mockRejectedValue(error);

      await expect(controller.suggestPlayerFromPreviousSessions(mockRequest)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('switchTeams', () => {
    const mockSession = {
      uid: 'session-uid-123',
      startDate: new Date('2025-12-01T10:00:00Z'),
      endDate: new Date('2025-12-01T12:00:00Z'),
    } as any;

    const mockRequest = {
      user: { uid: 'user-uid-789' },
    } as any;

    const teamUid = 'team-uid-456';

    it('should call playersService.switchPlayerToAnotherTeam and return void', async () => {
      mockPlayersService.switchPlayerToAnotherTeam.mockResolvedValue(undefined);

      await controller.switchTeams(mockSession, mockRequest, teamUid);

      expect(playersService.switchPlayerToAnotherTeam).toHaveBeenCalledWith(
        mockSession,
        mockRequest.user.uid,
        teamUid,
      );
    });

    it('should throw BadRequestException when player not found', async () => {
      mockPlayersService.switchPlayerToAnotherTeam.mockRejectedValue(
        new BadRequestException('Player not found'),
      );

      await expect(controller.switchTeams(mockSession, mockRequest, teamUid)).rejects.toThrow(
        BadRequestException,
      );
      expect(playersService.switchPlayerToAnotherTeam).toHaveBeenCalledWith(
        mockSession,
        mockRequest.user.uid,
        teamUid,
      );
    });

    it('should throw BadRequestException when team not found', async () => {
      mockPlayersService.switchPlayerToAnotherTeam.mockRejectedValue(
        new BadRequestException('Team not found'),
      );

      await expect(controller.switchTeams(mockSession, mockRequest, teamUid)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when player already on team', async () => {
      mockPlayersService.switchPlayerToAnotherTeam.mockRejectedValue(
        new BadRequestException('Player already on this team'),
      );

      await expect(controller.switchTeams(mockSession, mockRequest, teamUid)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('leaveSession', () => {
    const mockSession = {
      uid: 'session-uid-123',
      startDate: new Date('2025-12-01T10:00:00Z'),
      endDate: new Date('2025-12-01T12:00:00Z'),
    } as any;

    const mockRequest = {
      user: { uid: 'user-uid-789' },
    } as any;

    it('should call playersService.leaveSession and return void', async () => {
      mockPlayersService.leaveSession.mockResolvedValue(undefined);

      await controller.leaveSession(mockSession, mockRequest);

      expect(playersService.leaveSession).toHaveBeenCalledWith(mockSession, mockRequest.user.uid);
    });

    it('should throw BadRequestException when session has already started', async () => {
      mockPlayersService.leaveSession.mockRejectedValue(
        new BadRequestException('You cannot leave a session after it has started'),
      );

      await expect(controller.leaveSession(mockSession, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is not a player of the session', async () => {
      mockPlayersService.leaveSession.mockRejectedValue(
        new BadRequestException('You are not a player of this session'),
      );

      await expect(controller.leaveSession(mockSession, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

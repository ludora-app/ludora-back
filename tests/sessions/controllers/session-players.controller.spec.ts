import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { JoinSessionDto } from 'src/sessions/dto/input/create-session-player.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SessionPlayersController } from 'src/sessions/controllers/session-players.controller';
import { SessionsService } from 'src/sessions/services/sessions.service';

describe('SessionPlayersController', () => {
  let controller: SessionPlayersController;
  let sessionsService: SessionsService;

  const mockSessionsService = {
    joinSession: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionPlayersController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionPlayersController>(SessionPlayersController);
    sessionsService = module.get<SessionsService>(SessionsService);

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
});

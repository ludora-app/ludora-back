import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { SessionPlayersController } from 'src/session-players/session-players.controller';
import { SessionPlayersService } from 'src/session-players/session-players.service';
import { JoinSessionDto } from 'src/session-players/dto/input/create-session-player.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SessionPlayersController', () => {
  let controller: SessionPlayersController;
  let sessionPlayersService: SessionPlayersService;

  const mockSessionPlayersService = {
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
          provide: SessionPlayersService,
          useValue: mockSessionPlayersService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionPlayersController>(SessionPlayersController);
    sessionPlayersService = module.get<SessionPlayersService>(SessionPlayersService);

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
      mockSessionPlayersService.joinSession.mockResolvedValue(mockNewPlayer);

      const result = await controller.joinSession(mockRequest, mockJoinSessionDto);

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
      expect(result).toEqual({
        data: mockNewPlayer,
        message: 'Player joined session successfully',
      });
    });

    it('should pass the correct userUid from the request to the service', async () => {
      mockSessionPlayersService.joinSession.mockResolvedValue(mockNewPlayer);

      await controller.joinSession(mockRequest, mockJoinSessionDto);

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        sessionUid: mockJoinSessionDto.sessionUid,
        teamUid: mockJoinSessionDto.teamUid,
        userUid: 'user-uid-789',
      });
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionPlayersService.joinSession.mockRejectedValue(
        new NotFoundException(`Session ${mockJoinSessionDto.sessionUid} not found`),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockSessionPlayersService.joinSession.mockRejectedValue(
        new NotFoundException(`Team ${mockJoinSessionDto.teamUid} not found`),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw BadRequestException when session and team do not match', async () => {
      mockSessionPlayersService.joinSession.mockRejectedValue(
        new BadRequestException(
          `Session ${mockJoinSessionDto.sessionUid} and team ${mockJoinSessionDto.teamUid} do not match`,
        ),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });

    it('should throw BadRequestException when player already exists in session', async () => {
      mockSessionPlayersService.joinSession.mockRejectedValue(
        new BadRequestException(
          `Player ${mockRequest.user.uid} already in session ${mockJoinSessionDto.sessionUid}`,
        ),
      );

      await expect(controller.joinSession(mockRequest, mockJoinSessionDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(sessionPlayersService.joinSession).toHaveBeenCalledWith({
        ...mockJoinSessionDto,
        userUid: mockRequest.user.uid,
      });
    });
  });
});

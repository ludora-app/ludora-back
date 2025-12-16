import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;
  let sessionsService: SessionsService;
  let sessionTeamsService: SessionTeamsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sessionPlayers: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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

  const mockSessionsService = {
    findOne: jest.fn(),
  };

  const mockSessionTeamsService = {
    findOneByUid: jest.fn(),
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
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: SessionTeamsService,
          useValue: mockSessionTeamsService,
        },
      ],
    }).compile();

    service = module.get<SessionPlayersService>(SessionPlayersService);
    sessionsService = module.get<SessionsService>(SessionsService);
    sessionTeamsService = module.get<SessionTeamsService>(SessionTeamsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinSession', () => {
    const mockCreateSessionPlayerDto = {
      sessionUid: 'session-uid-123',
      teamUid: 'team-uid-456',
      userUid: 'user-uid-789',
    };

    const mockSession = {
      uid: 'session-uid-123',
      name: 'Test Session',
      startDateTime: new Date(),
      endDateTime: new Date(),
      maxPlayersPerTeam: 10,
    };

    const mockTeam = {
      uid: 'team-uid-456',
      sessionUid: 'session-uid-123',
      teamName: 'Test Team',
      teamLabel: 'A',
      createdAt: new Date(),
      updatedAt: new Date(),
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
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionTeamsService.findOneByUid.mockResolvedValue(mockTeam);
      mockPrismaService.sessionPlayers.findFirst.mockResolvedValue(null);
      mockPrismaService.sessionPlayers.create.mockResolvedValue(mockNewPlayer);

      const result = await service.joinSession(mockCreateSessionPlayerDto);

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(mockPrismaService.sessionPlayers.findFirst).toHaveBeenCalledWith({
        where: {
          sessionUid: mockCreateSessionPlayerDto.sessionUid,
          userUid: mockCreateSessionPlayerDto.userUid,
        },
      });
      expect(mockPrismaService.sessionPlayers.create).toHaveBeenCalledWith({
        data: {
          sessionUid: mockCreateSessionPlayerDto.sessionUid,
          teamUid: mockCreateSessionPlayerDto.teamUid,
          userUid: mockCreateSessionPlayerDto.userUid,
        },
      });
      expect(result).toEqual(mockNewPlayer);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Player ${mockCreateSessionPlayerDto.userUid} added to session ${mockCreateSessionPlayerDto.sessionUid}`,
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto)).rejects.toThrow(
        new NotFoundException(`Session ${mockCreateSessionPlayerDto.sessionUid} not found`),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Session ${mockCreateSessionPlayerDto.sessionUid} not found`,
      );
      expect(sessionTeamsService.findOneByUid).not.toHaveBeenCalled();
      expect(mockPrismaService.sessionPlayers.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionTeamsService.findOneByUid.mockResolvedValue(null);

      await expect(service.joinSession(mockCreateSessionPlayerDto)).rejects.toThrow(
        new NotFoundException(`Team ${mockCreateSessionPlayerDto.teamUid} not found`),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Team ${mockCreateSessionPlayerDto.teamUid} not found`,
      );
      expect(mockPrismaService.sessionPlayers.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when session and team do not match', async () => {
      const mismatchedTeam = {
        ...mockTeam,
        sessionUid: 'different-session-uid',
      };

      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionTeamsService.findOneByUid.mockResolvedValue(mismatchedTeam);

      await expect(service.joinSession(mockCreateSessionPlayerDto)).rejects.toThrow(
        new BadRequestException(
          `Session ${mockCreateSessionPlayerDto.sessionUid} and team ${mockCreateSessionPlayerDto.teamUid} do not match`,
        ),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Session ${mockCreateSessionPlayerDto.sessionUid} and team ${mockCreateSessionPlayerDto.teamUid} do not match`,
      );
      expect(mockPrismaService.sessionPlayers.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when team is full', async () => {
      const fullTeam = {
        ...mockTeam,
        _count: {
          sessionPlayers: 10,
        },
      };

      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionTeamsService.findOneByUid.mockResolvedValue(fullTeam);

      await expect(service.joinSession(mockCreateSessionPlayerDto)).rejects.toThrow(
        new BadRequestException(`Team ${mockCreateSessionPlayerDto.teamUid} is full`),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Team ${mockCreateSessionPlayerDto.teamUid} is full`,
      );
      expect(mockPrismaService.sessionPlayers.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.sessionPlayers.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when player already exists in session', async () => {
      const existingPlayer = {
        uid: 'existing-player-uid',
        sessionUid: mockCreateSessionPlayerDto.sessionUid,
        teamUid: mockCreateSessionPlayerDto.teamUid,
        userUid: mockCreateSessionPlayerDto.userUid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSessionsService.findOne.mockResolvedValue(mockSession);
      mockSessionTeamsService.findOneByUid.mockResolvedValue(mockTeam);
      mockPrismaService.sessionPlayers.findFirst.mockResolvedValue(existingPlayer);

      await expect(service.joinSession(mockCreateSessionPlayerDto)).rejects.toThrow(
        new BadRequestException(
          `Player ${mockCreateSessionPlayerDto.userUid} already in session ${mockCreateSessionPlayerDto.sessionUid}`,
        ),
      );

      expect(sessionsService.findOne).toHaveBeenCalledWith(mockCreateSessionPlayerDto.sessionUid);
      expect(sessionTeamsService.findOneByUid).toHaveBeenCalledWith(
        mockCreateSessionPlayerDto.teamUid,
      );
      expect(mockPrismaService.sessionPlayers.findFirst).toHaveBeenCalledWith({
        where: {
          sessionUid: mockCreateSessionPlayerDto.sessionUid,
          userUid: mockCreateSessionPlayerDto.userUid,
        },
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Player ${mockCreateSessionPlayerDto.userUid} already in session ${mockCreateSessionPlayerDto.sessionUid}`,
      );
      expect(mockPrismaService.sessionPlayers.create).not.toHaveBeenCalled();
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RatingStatus } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { RatingsService } from 'src/ratings/ratings.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { Sport } from 'src/shared/constants/constants';

describe('RatingsService', () => {
  let service: RatingsService;
  let _prismaService: PrismaService;
  let _playersService: SessionPlayersService;

  const mockPrismaService = {
    userRatings: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockPlayersService = {
    updateRatingStatus: jest.fn(),
    checkIfUsersArePlayers: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SessionPlayersService,
          useValue: mockPlayersService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _playersService = module.get<SessionPlayersService>(SessionPlayersService);

    jest.clearAllMocks();
  });

  describe('createMany', () => {
    const evaluatorUid = 'evaluator-1';
    const session = {
      uid: 'session-1',
      sport: Sport.BASKETBALL,
      endDate: new Date(Date.now() + 100000),
    } as any;
    const createRatingDtos = [{ evaluatedUid: 'evaluated-1', shoot: 5, defense: 4, dribble: 3 }];

    it('should successfully create ratings and update status', async () => {
      mockPlayersService.checkIfUsersArePlayers.mockResolvedValue(true);
      mockPrismaService.userRatings.createMany.mockResolvedValue({ count: 1 });

      await service.createMany(createRatingDtos as any, evaluatorUid, session);

      expect(mockPlayersService.checkIfUsersArePlayers).toHaveBeenCalledWith(session.uid, [
        'evaluated-1',
        evaluatorUid,
      ]);
      expect(mockPrismaService.userRatings.createMany).toHaveBeenCalled();
      expect(mockPlayersService.updateRatingStatus).toHaveBeenCalledWith(
        evaluatorUid,
        session.uid,
        RatingStatus.VALIDATED,
        expect.anything(),
      );
    });

    it('should throw BadRequestException if session has ended', async () => {
      const endedSession = { ...session, endDate: new Date(Date.now() - 100000) };

      await expect(
        service.createMany(createRatingDtos as any, evaluatorUid, endedSession),
      ).rejects.toThrow(new BadRequestException('You cannot rate a session after it has ended'));
    });

    it('should throw BadRequestException if not all users are players', async () => {
      mockPlayersService.checkIfUsersArePlayers.mockResolvedValue(false);

      await expect(
        service.createMany(createRatingDtos as any, evaluatorUid, session),
      ).rejects.toThrow(new BadRequestException('Not all users are players of this session'));
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

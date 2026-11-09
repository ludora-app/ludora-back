import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GameModes } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport } from 'src/shared/constants/constants';
import { SportsService } from 'src/sports/sports.service';

describe('SportsService', () => {
  let service: SportsService;

  const mockPrismaService = {
    sports: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllActivated', () => {
    it('should return the activated sports ordered by opening date then name', async () => {
      mockPrismaService.sports.findMany.mockResolvedValue([
        { gameModes: [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO], name: Sport.PADEL },
        { gameModes: [GameModes.FIVE_V_FIVE], name: Sport.FOOTBALL },
      ]);

      const result = await service.findAllActivated();

      expect(mockPrismaService.sports.findMany).toHaveBeenCalledWith({
        orderBy: [{ activatedAt: 'asc' }, { name: 'asc' }],
        select: { gameModes: true, name: true },
        where: { activatedAt: { not: null } },
      });
      expect(result).toEqual({
        items: [
          {
            gameModes: [
              { code: GameModes.ONE_V_ONE, playersPerTeam: 1 },
              { code: GameModes.TWO_V_TWO, playersPerTeam: 2 },
            ],
            name: Sport.PADEL,
          },
          {
            gameModes: [{ code: GameModes.FIVE_V_FIVE, playersPerTeam: 5 }],
            name: Sport.FOOTBALL,
          },
        ],
        nextCursor: null,
        totalCount: 2,
      });
    });

    it('should return an empty collection when no sport is opened', async () => {
      mockPrismaService.sports.findMany.mockResolvedValue([]);

      const result = await service.findAllActivated();

      expect(result).toEqual({ items: [], nextCursor: null, totalCount: 0 });
    });
  });

  describe('assertAllowed', () => {
    it('should pass when the sport is opened and the game modes are allowed', async () => {
      mockPrismaService.sports.findUnique.mockResolvedValue({
        activatedAt: new Date('2026-01-01T00:00:00Z'),
        gameModes: [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO],
      });

      await expect(
        service.assertAllowed(Sport.TENNIS, [GameModes.TWO_V_TWO]),
      ).resolves.toBeUndefined();
      expect(mockPrismaService.sports.findUnique).toHaveBeenCalledWith({
        select: { activatedAt: true, gameModes: true },
        where: { name: Sport.TENNIS },
      });
    });

    it('should pass with an empty list of game modes on an opened sport', async () => {
      mockPrismaService.sports.findUnique.mockResolvedValue({
        activatedAt: new Date('2026-01-01T00:00:00Z'),
        gameModes: [GameModes.ONE_V_ONE],
      });

      await expect(service.assertAllowed(Sport.TENNIS, [])).resolves.toBeUndefined();
    });

    it('should throw BadRequestException when the sport does not exist', async () => {
      mockPrismaService.sports.findUnique.mockResolvedValue(null);

      await expect(service.assertAllowed('UNKNOWN', [GameModes.ONE_V_ONE])).rejects.toThrow(
        new BadRequestException('The sport UNKNOWN is not available'),
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should throw BadRequestException when the sport is not opened', async () => {
      mockPrismaService.sports.findUnique.mockResolvedValue({
        activatedAt: null,
        gameModes: [GameModes.SIX_V_SIX],
      });

      await expect(service.assertAllowed(Sport.VOLLEYBALL, [GameModes.SIX_V_SIX])).rejects.toThrow(
        new BadRequestException('The sport VOLLEYBALL is not available'),
      );
    });

    it('should throw BadRequestException when a game mode is not allowed', async () => {
      mockPrismaService.sports.findUnique.mockResolvedValue({
        activatedAt: new Date('2026-01-01T00:00:00Z'),
        gameModes: [GameModes.ONE_V_ONE, GameModes.TWO_V_TWO],
      });

      await expect(
        service.assertAllowed(Sport.PADEL, [GameModes.TWO_V_TWO, GameModes.FIVE_V_FIVE]),
      ).rejects.toThrow(
        new BadRequestException('The game mode FIVE_V_FIVE is not allowed for the sport PADEL'),
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});

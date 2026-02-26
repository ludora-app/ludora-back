import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GameModes } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';

describe('SportPreferencesService', () => {
  let service: SportPreferencesService;
  let prismaService: PrismaService;
  let logger: PinoLogger;

  beforeEach(async () => {
    const mockPrismaService = {
      users: {
        findUnique: jest.fn(),
      },
      userSportPreferences: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      userGameModePreferences: {
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockPinoLogger = {
      setContext: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportPreferencesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<SportPreferencesService>(SportPreferencesService);
    prismaService = module.get<PrismaService>(PrismaService);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUserUid', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };
    const userUid = 'user-uid-1';

    it('should return all sport preferences for a user', async () => {
      const mockPreferences = [
        {
          uid: 'sport-pref-uid-1',
          sport: Sport.BASKETBALL,
          userUid,
          level: UserSportLevel.BEGINNER,
          userGameModePreferences: [] as { gameMode: GameModes; uid: string }[],
        },
        {
          uid: 'sport-pref-uid-2',
          sport: Sport.FOOTBALL,
          userUid,
          level: UserSportLevel.INTERMEDIATE,
          userGameModePreferences: [] as { gameMode: GameModes; uid: string }[],
        },
        {
          uid: 'sport-pref-uid-3',
          sport: Sport.TENNIS,
          userUid,
          level: UserSportLevel.ADVANCED,
          userGameModePreferences: [] as { gameMode: GameModes; uid: string }[],
        },
      ];

      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({ uid: mockUser.uid });
      (prismaService.userSportPreferences.findMany as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: [
          {
            uid: 'sport-pref-uid-1',
            sport: Sport.BASKETBALL,
            level: UserSportLevel.BEGINNER,
            gameModes: [],
          },
          {
            uid: 'sport-pref-uid-2',
            sport: Sport.FOOTBALL,
            level: UserSportLevel.INTERMEDIATE,
            gameModes: [],
          },
          {
            uid: 'sport-pref-uid-3',
            sport: Sport.TENNIS,
            level: UserSportLevel.ADVANCED,
            gameModes: [],
          },
        ],
        nextCursor: null,
        totalCount: 3,
      });
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        select: { uid: true },
        where: { uid: userUid },
      });
      expect(prismaService.userSportPreferences.findMany).toHaveBeenCalledWith({
        select: {
          level: true,
          sport: true,
          uid: true,
          userGameModePreferences: {
            select: {
              gameMode: true,
              uid: true,
            },
          },
        },
        where: { userUid },
      });
    });

    it('should return empty array when user has no sport preferences', async () => {
      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({ uid: mockUser.uid });
      (prismaService.userSportPreferences.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
      expect(prismaService.userSportPreferences.findMany).toHaveBeenCalledWith({
        select: {
          level: true,
          sport: true,
          uid: true,
          userGameModePreferences: {
            select: {
              gameMode: true,
              uid: true,
            },
          },
        },
        where: { userUid },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prismaService.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findAllByUserUid(userUid)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userSportPreferences.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const uid = 'sport-pref-uid-1';

    it('should return a sport preference by uid', async () => {
      const mockPreference = {
        uid,
        sport: Sport.BASKETBALL,
        userUid: 'user-uid-1',
        level: UserSportLevel.BEGINNER,
        userGameModePreferences: [] as { gameMode: GameModes; uid: string }[],
      };

      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreference,
      );

      const result = await service.findOne(uid);

      expect(result).toEqual({
        uid,
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        gameModes: [],
      });
      expect(prismaService.userSportPreferences.findUnique).toHaveBeenCalledWith({
        select: {
          level: true,
          sport: true,
          uid: true,
          userGameModePreferences: {
            select: {
              gameMode: true,
              uid: true,
            },
          },
        },
        where: { uid },
      });
    });

    it('should throw NotFoundException when sport preference not found', async () => {
      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent-uid')).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(prismaService.userSportPreferences.findUnique).toHaveBeenCalledWith({
        select: {
          level: true,
          sport: true,
          uid: true,
          userGameModePreferences: {
            select: {
              gameMode: true,
              uid: true,
            },
          },
        },
        where: { uid: 'non-existent-uid' },
      });
    });
  });

  describe('clearPreferences', () => {
    const userUid = 'user-uid-1';

    it('should delete all sport preferences for the user', async () => {
      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      await service.clearPreferences(userUid);

      expect(prismaService.userSportPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(prismaService.userGameModePreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(logger.debug).toHaveBeenCalledWith(
        `All sport preferences cleared for user: ${userUid}`,
      );
    });
  });

  describe('createManyWithGameModes', () => {
    const userUid = 'user-uid-1';

    it('should clear preferences then create sport preferences with game modes in a transaction', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [GameModes.FIVE_V_FIVE, GameModes.THREE_V_THREE],
        },
        {
          sport: Sport.VOLLEYBALL,
          level: UserSportLevel.ADVANCED,
          gameModes: [GameModes.SIX_V_SIX],
        },
      ];

      const mockSportCreate = jest.fn().mockResolvedValue({});
      const mockGameModeCreate = jest.fn().mockResolvedValue({});

      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: { create: mockSportCreate },
          userGameModePreferences: { create: mockGameModeCreate },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.userSportPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(prismaService.userGameModePreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockSportCreate).toHaveBeenCalledTimes(2);
      expect(mockSportCreate).toHaveBeenNthCalledWith(1, {
        data: { level: UserSportLevel.INTERMEDIATE, sport: Sport.BASKETBALL, userUid },
      });
      expect(mockSportCreate).toHaveBeenNthCalledWith(2, {
        data: { level: UserSportLevel.ADVANCED, sport: Sport.VOLLEYBALL, userUid },
      });
      expect(mockGameModeCreate).toHaveBeenCalledTimes(3);
      expect(mockGameModeCreate).toHaveBeenNthCalledWith(1, {
        data: { gameMode: GameModes.FIVE_V_FIVE, sport: Sport.BASKETBALL, userUid },
      });
      expect(mockGameModeCreate).toHaveBeenNthCalledWith(2, {
        data: { gameMode: GameModes.THREE_V_THREE, sport: Sport.BASKETBALL, userUid },
      });
      expect(mockGameModeCreate).toHaveBeenNthCalledWith(3, {
        data: { gameMode: GameModes.SIX_V_SIX, sport: Sport.VOLLEYBALL, userUid },
      });
      expect(logger.debug).toHaveBeenCalledWith('2 sport preferences created');
    });

    it('should throw BadRequestException when preferences contain duplicate sports', async () => {
      const preferences = [
        { sport: Sport.BASKETBALL, level: UserSportLevel.BEGINNER, gameModes: [] },
        { sport: Sport.BASKETBALL, level: UserSportLevel.INTERMEDIATE, gameModes: [] },
      ];

      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      await expect(service.createManyWithGameModes(preferences, userUid)).rejects.toThrow(
        new BadRequestException('Each sport preference must have a unique sport.'),
      );
      expect(logger.error).toHaveBeenCalledWith('Each sport preference must have a unique sport.');
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should create sport preferences with empty game modes', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [],
        },
      ];

      const mockSportCreate = jest.fn().mockResolvedValue({});
      const mockGameModeCreate = jest.fn().mockResolvedValue({});

      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: { create: mockSportCreate },
          userGameModePreferences: { create: mockGameModeCreate },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(mockSportCreate).toHaveBeenCalledTimes(1);
      expect(mockGameModeCreate).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('1 sport preferences created');
    });

    it('should create multiple sports with multiple game modes each', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [GameModes.FIVE_V_FIVE, GameModes.THREE_V_THREE],
        },
        {
          sport: Sport.FOOTBALL,
          level: UserSportLevel.BEGINNER,
          gameModes: [GameModes.ELEVEN_V_ELEVEN, GameModes.FIVE_V_FIVE],
        },
      ];

      const mockSportCreate = jest.fn().mockResolvedValue({});
      const mockGameModeCreate = jest.fn().mockResolvedValue({});

      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: { create: mockSportCreate },
          userGameModePreferences: { create: mockGameModeCreate },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(mockSportCreate).toHaveBeenCalledTimes(2);
      expect(mockGameModeCreate).toHaveBeenCalledTimes(4);
      expect(logger.debug).toHaveBeenCalledWith('2 sport preferences created');
    });

    it('should call clearPreferences (deleteMany) with userUid before creating', async () => {
      const preferences = [
        {
          sport: Sport.TENNIS,
          level: UserSportLevel.ADVANCED,
          gameModes: [GameModes.ONE_V_ONE],
        },
      ];

      (prismaService.userSportPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prismaService.userGameModePreferences.deleteMany as jest.Mock).mockResolvedValue({
        count: 3,
      });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: { create: jest.fn().mockResolvedValue({}) },
          userGameModePreferences: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.userSportPreferences.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaService.userSportPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(prismaService.userGameModePreferences.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaService.userGameModePreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserSportPreferences } from 'generated/prisma/browser';
import { GameModes } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';

describe('SportPreferencesService', () => {
  let service: SportPreferencesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let logger: PinoLogger;

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };

    const mockPrismaService = {
      userSportPreferences: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      userGameModePreferences: {
        findFirst: jest.fn(),
        create: jest.fn(),
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
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<SportPreferencesService>(SportPreferencesService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };
    const sport = Sport.BASKETBALL;
    const userUid = 'user-uid-1';

    it('should create a sport preference successfully', async () => {
      const mockCreatedPreference: UserSportPreferences = {
        uid: 'sport-pref-uid-1',
        sport,
        userUid,
        createdAt: mockCurrentDate,
        level: UserSportLevel.BEGINNER,
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.userSportPreferences.create as jest.Mock).mockResolvedValue(
        mockCreatedPreference,
      );

      const result = await service.create({ sport, userUid, level: UserSportLevel.BEGINNER });

      expect(result).toEqual(mockCreatedPreference);
      expect(usersService.findOne).toHaveBeenCalledWith(userUid, expect.any(Object));
      expect(prismaService.userSportPreferences.findFirst).toHaveBeenCalledWith({
        where: { sport, userUid },
      });
      expect(prismaService.userSportPreferences.create).toHaveBeenCalledWith({
        data: { sport, userUid, level: UserSportLevel.BEGINNER },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create({ sport, userUid, level: UserSportLevel.BEGINNER }),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userSportPreferences.findFirst).not.toHaveBeenCalled();
      expect(prismaService.userSportPreferences.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when sport preference already exists', async () => {
      const existingPreference: UserSportPreferences = {
        uid: 'existing-sport-pref-uid',
        sport,
        userUid,
        createdAt: mockCurrentDate,
        level: UserSportLevel.BEGINNER,
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue(
        existingPreference,
      );

      await expect(
        service.create({ sport, userUid, level: UserSportLevel.BEGINNER }),
      ).rejects.toThrow(new BadRequestException('Sport preference already exists'));
      expect(logger.error).toHaveBeenCalledWith(
        `Sport preference already exists: ${sport} for user: ${userUid}`,
      );
      expect(prismaService.userSportPreferences.create).not.toHaveBeenCalled();
    });

    it('should create sport preferences for different sports', async () => {
      const sports = [Sport.BASKETBALL, Sport.FOOTBALL, Sport.TENNIS];

      for (const sportType of sports) {
        const mockCreatedPreference: UserSportPreferences = {
          uid: `sport-pref-uid-${sportType}`,
          sport: sportType,
          userUid,
          createdAt: mockCurrentDate,
          level: UserSportLevel.BEGINNER,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.userSportPreferences.create as jest.Mock).mockResolvedValue(
          mockCreatedPreference,
        );

        const result = await service.create({
          sport: sportType,
          userUid,
          level: UserSportLevel.BEGINNER,
        });

        expect(result).toEqual(mockCreatedPreference);
        expect(prismaService.userSportPreferences.create).toHaveBeenCalledWith({
          data: { sport: sportType, userUid, level: UserSportLevel.BEGINNER },
        });
      }
    });
  });

  describe('findAllByUserUid', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };
    const userUid = 'user-uid-1';

    it('should return all sport preferences for a user', async () => {
      const mockPreferences: UserSportPreferences[] = [
        {
          uid: 'sport-pref-uid-1',
          sport: Sport.BASKETBALL,
          userUid,
          createdAt: mockCurrentDate,
          level: UserSportLevel.BEGINNER,
        },
        {
          uid: 'sport-pref-uid-2',
          sport: Sport.FOOTBALL,
          userUid,
          createdAt: mockCurrentDate,
          level: UserSportLevel.INTERMEDIATE,
        },
        {
          uid: 'sport-pref-uid-3',
          sport: Sport.TENNIS,
          userUid,
          createdAt: mockCurrentDate,
          level: UserSportLevel.ADVANCED,
        },
      ];

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findMany as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: mockPreferences,
        nextCursor: null,
        totalCount: mockPreferences.length,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(userUid, expect.any(Object));
      expect(prismaService.userSportPreferences.findMany).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          level: true,
          sport: true,
          uid: true,
        },
        where: { userUid },
      });
    });

    it('should return empty array when user has no sport preferences', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
      expect(prismaService.userSportPreferences.findMany).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          level: true,
          sport: true,
          uid: true,
        },
        where: { userUid },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

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
      const mockPreference: UserSportPreferences = {
        uid,
        sport: Sport.BASKETBALL,
        userUid: 'user-uid-1',
        createdAt: mockCurrentDate,
        level: UserSportLevel.BEGINNER,
      };

      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreference,
      );

      const result = await service.findOne(uid);

      expect(result).toEqual(mockPreference);
      expect(prismaService.userSportPreferences.findUnique).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          level: true,
          sport: true,
          uid: true,
        },
        where: { uid },
      });
    });

    it('should return null when sport preference not found', async () => {
      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne('non-existent-uid');

      expect(result).toBeNull();
      expect(prismaService.userSportPreferences.findUnique).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          level: true,
          sport: true,
          uid: true,
        },
        where: { uid: 'non-existent-uid' },
      });
    });
  });

  describe('remove', () => {
    const uid = 'sport-pref-uid-1';
    const userUid = 'user-uid-1';

    const mockPreference: UserSportPreferences = {
      uid,
      sport: Sport.BASKETBALL,
      userUid,
      createdAt: mockCurrentDate,
      level: UserSportLevel.BEGINNER,
    };

    it('should delete a sport preference successfully', async () => {
      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreference,
      );
      (prismaService.userSportPreferences.delete as jest.Mock).mockResolvedValue(mockPreference);

      await service.remove(uid, userUid);

      expect(prismaService.userSportPreferences.findUnique).toHaveBeenCalledWith({
        where: { uid },
      });
      expect(prismaService.userSportPreferences.delete).toHaveBeenCalledWith({
        where: { uid },
      });
      expect(logger.info).toHaveBeenCalledWith(`Sport preference deleted: ${uid}`);
    });

    it('should throw NotFoundException when sport preference does not exist', async () => {
      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(uid, userUid)).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Sport preference not found: ${uid}`);
      expect(prismaService.userSportPreferences.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when userUid does not match', async () => {
      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreference,
      );

      await expect(service.remove(uid, 'different-user-uid')).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Sport preference not found: ${uid}`);
      expect(prismaService.userSportPreferences.delete).not.toHaveBeenCalled();
    });

    it('should allow user to delete their own sport preference', async () => {
      const anotherPreference: UserSportPreferences = {
        uid: 'sport-pref-uid-2',
        sport: Sport.FOOTBALL,
        userUid: 'user-uid-2',
        createdAt: mockCurrentDate,
        level: UserSportLevel.INTERMEDIATE,
      };

      (prismaService.userSportPreferences.findUnique as jest.Mock).mockResolvedValue(
        anotherPreference,
      );

      await expect(service.remove('sport-pref-uid-2', 'user-uid-1')).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(prismaService.userSportPreferences.delete).not.toHaveBeenCalled();
    });
  });

  describe('createManyWithGameModes', () => {
    const userUid = 'user-uid-1';

    it('should create sport preferences with game modes successfully', async () => {
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

      const mockCreate = jest.fn().mockResolvedValue({});
      const mockUpdate = jest.fn().mockResolvedValue({});

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: mockCreate,
            update: mockUpdate,
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(2);
      expect(logger.debug).toHaveBeenCalledWith('2 sport preferences created');
    });

    it('should handle existing sport preferences with different levels', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.ADVANCED,
          gameModes: [GameModes.FIVE_V_FIVE],
        },
      ];

      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockCreate = jest.fn().mockResolvedValue({});

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue({
              uid: 'existing-uid',
              sport: Sport.BASKETBALL,
              level: UserSportLevel.BEGINNER,
              userUid,
            }),
            create: mockCreate,
            update: mockUpdate,
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        data: { level: UserSportLevel.ADVANCED },
        where: { uid: 'existing-uid' },
      });
    });

    it('should handle existing sport preferences with same level', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [GameModes.FIVE_V_FIVE],
        },
      ];

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue({
              uid: 'existing-uid',
              sport: Sport.BASKETBALL,
              level: UserSportLevel.INTERMEDIATE,
              userUid,
            }),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(logger.warn).toHaveBeenCalledWith(
        `Sport preference already exists: ${Sport.BASKETBALL} for user: ${userUid}`,
      );
    });

    it('should handle existing game mode preferences', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [GameModes.FIVE_V_FIVE, GameModes.THREE_V_THREE],
        },
      ];

      const mockGameModeCreate = jest.fn().mockResolvedValue({});

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          },
          userGameModePreferences: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce({ gameMode: GameModes.FIVE_V_FIVE })
              .mockResolvedValueOnce(null),
            create: mockGameModeCreate,
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(logger.warn).toHaveBeenCalledWith(
        `Game mode preference already exists: ${GameModes.FIVE_V_FIVE} for user: ${userUid}`,
      );
      expect(mockGameModeCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle empty game modes array', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [],
        },
      ];

      const mockGameModeCreate = jest.fn();

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          },
          userGameModePreferences: {
            findFirst: jest.fn(),
            create: mockGameModeCreate,
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(mockGameModeCreate).not.toHaveBeenCalled();
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

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: mockSportCreate,
            update: jest.fn().mockResolvedValue({}),
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: mockGameModeCreate,
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(2);
      expect(mockSportCreate).toHaveBeenCalledTimes(2);
      expect(mockGameModeCreate).toHaveBeenCalledTimes(4);
    });

    it('should not update sport preference when level is same', async () => {
      const preferences = [
        {
          sport: Sport.TENNIS,
          level: UserSportLevel.ADVANCED,
          gameModes: [GameModes.ONE_V_ONE],
        },
      ];

      const mockUpdate = jest.fn();
      const mockCreate = jest.fn();

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue({
              uid: 'existing-uid',
              sport: Sport.TENNIS,
              level: UserSportLevel.ADVANCED,
              userUid,
            }),
            create: mockCreate,
            update: mockUpdate,
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        `Sport preference already exists: ${Sport.TENNIS} for user: ${userUid}`,
      );
    });

    it('should handle transactions correctly for each preference', async () => {
      const preferences = [
        {
          sport: Sport.BASKETBALL,
          level: UserSportLevel.INTERMEDIATE,
          gameModes: [GameModes.FIVE_V_FIVE],
        },
        {
          sport: Sport.VOLLEYBALL,
          level: UserSportLevel.ADVANCED,
          gameModes: [GameModes.SIX_V_SIX],
        },
        {
          sport: Sport.FOOTBALL,
          level: UserSportLevel.BEGINNER,
          gameModes: [GameModes.ELEVEN_V_ELEVEN],
        },
      ];

      (prismaService.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          userSportPreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          },
          userGameModePreferences: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await service.createManyWithGameModes(preferences, userUid);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(3);
      expect(logger.debug).toHaveBeenCalledWith('3 sport preferences created');
    });
  });
});

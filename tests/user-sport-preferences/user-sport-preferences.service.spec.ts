import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserSports } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { UserSportPreferencesService } from 'src/user-sport-preferences/user-sport-preferences.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport } from 'src/shared/constants/constants';

describe('UserSportPreferencesService', () => {
  let service: UserSportPreferencesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let logger: PinoLogger;

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };

    const mockPrismaService = {
      userSports: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
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
        UserSportPreferencesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<UserSportPreferencesService>(UserSportPreferencesService);
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
      const mockCreatedPreference: UserSports = {
        uid: 'sport-pref-uid-1',
        sport,
        userUid,
        createdAt: mockCurrentDate,
        updatedAt: mockCurrentDate,
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSports.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.userSports.create as jest.Mock).mockResolvedValue(mockCreatedPreference);

      const result = await service.create(sport, userUid);

      expect(result).toEqual(mockCreatedPreference);
      expect(usersService.findOne).toHaveBeenCalledWith(userUid, expect.any(Object));
      expect(prismaService.userSports.findFirst).toHaveBeenCalledWith({
        where: { sport, userUid },
      });
      expect(prismaService.userSports.create).toHaveBeenCalledWith({
        data: { sport, userUid },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(sport, userUid)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userSports.findFirst).not.toHaveBeenCalled();
      expect(prismaService.userSports.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when sport preference already exists', async () => {
      const existingPreference: UserSports = {
        uid: 'existing-sport-pref-uid',
        sport,
        userUid,
        createdAt: mockCurrentDate,
        updatedAt: mockCurrentDate,
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSports.findFirst as jest.Mock).mockResolvedValue(existingPreference);

      await expect(service.create(sport, userUid)).rejects.toThrow(
        new BadRequestException('Sport preference already exists'),
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Sport preference already exists: ${sport} for user: ${userUid}`,
      );
      expect(prismaService.userSports.create).not.toHaveBeenCalled();
    });

    it('should create sport preferences for different sports', async () => {
      const sports = [Sport.BASKETBALL, Sport.FOOTBALL, Sport.TENNIS];

      for (const sportType of sports) {
        const mockCreatedPreference: UserSports = {
          uid: `sport-pref-uid-${sportType}`,
          sport: sportType,
          userUid,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (prismaService.userSports.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.userSports.create as jest.Mock).mockResolvedValue(mockCreatedPreference);

        const result = await service.create(sportType, userUid);

        expect(result).toEqual(mockCreatedPreference);
        expect(prismaService.userSports.create).toHaveBeenCalledWith({
          data: { sport: sportType, userUid },
        });
      }
    });
  });

  describe('findAllByUserUid', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };
    const userUid = 'user-uid-1';

    it('should return all sport preferences for a user', async () => {
      const mockPreferences: UserSports[] = [
        {
          uid: 'sport-pref-uid-1',
          sport: Sport.BASKETBALL,
          userUid,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
        {
          uid: 'sport-pref-uid-2',
          sport: Sport.FOOTBALL,
          userUid,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
        {
          uid: 'sport-pref-uid-3',
          sport: Sport.TENNIS,
          userUid,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
      ];

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSports.findMany as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: mockPreferences,
        nextCursor: null,
        totalCount: mockPreferences.length,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(userUid, expect.any(Object));
      expect(prismaService.userSports.findMany).toHaveBeenCalledWith({
        where: { userUid },
      });
    });

    it('should return empty array when user has no sport preferences', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSports.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
      expect(prismaService.userSports.findMany).toHaveBeenCalledWith({
        where: { userUid },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findAllByUserUid(userUid)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userSports.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const uid = 'sport-pref-uid-1';

    it('should return a sport preference by uid', async () => {
      const mockPreference: UserSports = {
        uid,
        sport: Sport.BASKETBALL,
        userUid: 'user-uid-1',
        createdAt: mockCurrentDate,
        updatedAt: mockCurrentDate,
      };

      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(mockPreference);

      const result = await service.findOne(uid);

      expect(result).toEqual(mockPreference);
      expect(prismaService.userSports.findUnique).toHaveBeenCalledWith({
        where: { uid },
      });
    });

    it('should return null when sport preference not found', async () => {
      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne('non-existent-uid');

      expect(result).toBeNull();
      expect(prismaService.userSports.findUnique).toHaveBeenCalledWith({
        where: { uid: 'non-existent-uid' },
      });
    });
  });

  describe('remove', () => {
    const uid = 'sport-pref-uid-1';
    const userUid = 'user-uid-1';

    const mockPreference: UserSports = {
      uid,
      sport: Sport.BASKETBALL,
      userUid,
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    it('should delete a sport preference successfully', async () => {
      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(mockPreference);
      (prismaService.userSports.delete as jest.Mock).mockResolvedValue(mockPreference);

      await service.remove(uid, userUid);

      expect(prismaService.userSports.findUnique).toHaveBeenCalledWith({
        where: { uid },
      });
      expect(prismaService.userSports.delete).toHaveBeenCalledWith({
        where: { uid },
      });
      expect(logger.info).toHaveBeenCalledWith(`Sport preference deleted: ${uid}`);
    });

    it('should throw NotFoundException when sport preference does not exist', async () => {
      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(uid, userUid)).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Sport preference not found: ${uid}`);
      expect(prismaService.userSports.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when userUid does not match', async () => {
      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(mockPreference);

      await expect(service.remove(uid, 'different-user-uid')).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Sport preference not found: ${uid}`);
      expect(prismaService.userSports.delete).not.toHaveBeenCalled();
    });

    it('should allow user to delete their own sport preference', async () => {
      const anotherPreference: UserSports = {
        uid: 'sport-pref-uid-2',
        sport: Sport.FOOTBALL,
        userUid: 'user-uid-2',
        createdAt: mockCurrentDate,
        updatedAt: mockCurrentDate,
      };

      (prismaService.userSports.findUnique as jest.Mock).mockResolvedValue(anotherPreference);

      await expect(service.remove('sport-pref-uid-2', 'user-uid-1')).rejects.toThrow(
        new NotFoundException('Sport preference not found'),
      );
      expect(prismaService.userSports.delete).not.toHaveBeenCalled();
    });
  });
});

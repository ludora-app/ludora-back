import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';
import { PinoLogger } from 'nestjs-pino';
import { CreateHourPreferenceDto } from 'src/user-preferences/dto/input/create-hour-preference.dto';
import { DateUtils } from 'src/shared/utils/date.utils';

jest.mock('src/shared/utils/date.utils', () => ({
  DateUtils: {
    getDayOfWeekNumber: jest.fn(),
  },
}));

describe('HourPreferencesService', () => {
  let service: HourPreferencesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let logger: PinoLogger;

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');
  const mockFutureDate = new Date('2023-01-10T14:00:00Z');

  beforeEach(async () => {
    // Mock current date
    const OriginalDate = global.Date;
    jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (!args.length) {
        return mockCurrentDate;
      }
      return new OriginalDate(...args);
    });

    const mockUsersService = {
      findOne: jest.fn(),
    };
    const mockPrismaService = {
      userHourPreferences: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
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
        HourPreferencesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<HourPreferencesService>(HourPreferencesService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    logger = module.get<PinoLogger>(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };

    describe('RECURRENT preference', () => {
      const createRecurrentDto: CreateHourPreferenceDto = {
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
        preferenceType: UserHourPreferenceType.RECURRENT,
      };

      it('should create a recurrent hour preference successfully', async () => {
        const mockCreatedPreference = {
          uid: 'pref-uid-1',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
          date: null,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.userHourPreferences.create as jest.Mock).mockResolvedValue(
          mockCreatedPreference,
        );

        const result = await service.create('user-uid-1', createRecurrentDto);

        expect(result).toEqual(mockCreatedPreference);
        expect(usersService.findOne).toHaveBeenCalledWith('user-uid-1', expect.any(Object));
        expect(prismaService.userHourPreferences.findFirst).toHaveBeenCalledWith({
          where: {
            dayOfWeek: 2,
            timePeriod: TimePeriod.MORNING,
            userUid: 'user-uid-1',
          },
        });
        expect(prismaService.userHourPreferences.create).toHaveBeenCalledWith({
          data: {
            dayOfWeek: 2,
            timePeriod: TimePeriod.MORNING,
            type: UserHourPreferenceType.RECURRENT,
            userUid: 'user-uid-1',
          },
        });
      });

      it('should throw NotFoundException when user does not exist', async () => {
        (usersService.findOne as jest.Mock).mockResolvedValue(null);

        await expect(service.create('user-uid-1', createRecurrentDto)).rejects.toThrow(
          new NotFoundException('User not found'),
        );
        expect(logger.error).toHaveBeenCalledWith('User not found: user-uid-1');
      });

      it('should throw BadRequestException when recurrent preference already exists', async () => {
        const existingPreference = {
          uid: 'existing-pref-uid',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(
          existingPreference,
        );

        await expect(service.create('user-uid-1', createRecurrentDto)).rejects.toThrow(
          new BadRequestException('An hour preference already exists for this day and time period'),
        );
      });
    });

    describe('ONE_TIME preference', () => {
      const createOneTimeDto: CreateHourPreferenceDto = {
        timePeriod: TimePeriod.AFTERNOON,
        preferenceType: UserHourPreferenceType.ONE_TIME,
        date: mockFutureDate.toISOString(),
      };

      it('should create a one-time hour preference successfully', async () => {
        const mockCreatedPreference = {
          uid: 'pref-uid-1',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          date: mockFutureDate,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (DateUtils.getDayOfWeekNumber as jest.Mock).mockReturnValue(2);
        (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(null);
        (prismaService.userHourPreferences.create as jest.Mock).mockResolvedValue(
          mockCreatedPreference,
        );

        const result = await service.create('user-uid-1', createOneTimeDto);

        expect(result).toEqual(mockCreatedPreference);
        expect(DateUtils.getDayOfWeekNumber).toHaveBeenCalledWith(mockFutureDate.toISOString());
        expect(prismaService.userHourPreferences.create).toHaveBeenCalledWith({
          data: {
            date: mockFutureDate.toISOString(),
            dayOfWeek: 2,
            timePeriod: TimePeriod.AFTERNOON,
            type: UserHourPreferenceType.ONE_TIME,
            userUid: 'user-uid-1',
          },
          select: {
            createdAt: true,
            date: true,
            dayOfWeek: true,
            timePeriod: true,
            type: true,
            uid: true,
          },
        });
      });

      it('should throw BadRequestException when date is in the past', async () => {
        const pastDate = new Date('2022-01-01T12:00:00Z');
        const pastDateDto: CreateHourPreferenceDto = {
          timePeriod: TimePeriod.AFTERNOON,
          preferenceType: UserHourPreferenceType.ONE_TIME,
          date: pastDate.toISOString(),
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (DateUtils.getDayOfWeekNumber as jest.Mock).mockReturnValue(2);
        (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(service.create('user-uid-1', pastDateDto)).rejects.toThrow(
          new BadRequestException('The date is in the past'),
        );
      });

      it('should throw BadRequestException when one-time preference conflicts with recurrent', async () => {
        const existingPreference = {
          uid: 'existing-pref-uid',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.RECURRENT,
        };

        (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
        (DateUtils.getDayOfWeekNumber as jest.Mock).mockReturnValue(2);
        (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(
          existingPreference,
        );

        await expect(service.create('user-uid-1', createOneTimeDto)).rejects.toThrow(
          new BadRequestException('An hour preference already exists for this day and time period'),
        );
      });
    });
  });

  describe('findAllByUserUid', () => {
    const mockUser = { uid: 'user-uid-1', email: 'test@example.com' };

    it('should return all hour preferences for a user', async () => {
      const mockPreferences = [
        {
          uid: 'pref-uid-1',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
          date: null,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
        {
          uid: 'pref-uid-2',
          userUid: 'user-uid-1',
          dayOfWeek: 3,
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          date: mockFutureDate,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        },
      ];

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userHourPreferences.findMany as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await service.findAllByUserUid('user-uid-1');

      expect(result).toEqual({
        items: mockPreferences,
        nextCursor: null,
        totalCount: 2,
      });
      expect(logger.debug).toHaveBeenCalledWith(
        'Finding all hour preferences for user: user-uid-1',
      );
      expect(prismaService.userHourPreferences.findMany).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          date: true,
          dayOfWeek: true,
          timePeriod: true,
          type: true,
          uid: true,
        },
        where: {
          OR: [
            { type: UserHourPreferenceType.RECURRENT, userUid: 'user-uid-1' },
            { date: { gt: mockCurrentDate }, userUid: 'user-uid-1' },
          ],
        },
      });
    });

    it('should return empty array when user has no preferences', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userHourPreferences.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid('user-uid-1');

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findAllByUserUid('user-uid-1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('User not found: user-uid-1');
    });
  });

  describe('checkIfRecurrentHourPreferenceExists', () => {
    it('should return true when recurrent preference exists', async () => {
      const mockPreference = {
        uid: 'pref-uid-1',
        userUid: 'user-uid-1',
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
        type: UserHourPreferenceType.RECURRENT,
      };

      (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(mockPreference);

      const result = await service.checkIfRecurrentHourPreferenceExists({
        userUid: 'user-uid-1',
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
      });

      expect(result).toBe(true);
      expect(prismaService.userHourPreferences.findFirst).toHaveBeenCalledWith({
        where: {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          userUid: 'user-uid-1',
        },
      });
    });

    it('should return false when no preference exists', async () => {
      (prismaService.userHourPreferences.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.checkIfRecurrentHourPreferenceExists({
        userUid: 'user-uid-1',
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
      });

      expect(result).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a preference by uid', async () => {
      const mockPreference = {
        uid: 'pref-uid-1',
        userUid: 'user-uid-1',
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
        type: UserHourPreferenceType.RECURRENT,
        date: null,
        createdAt: mockCurrentDate,
        updatedAt: mockCurrentDate,
      };

      (prismaService.userHourPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreference);

      const result = await service.findOne('pref-uid-1');

      expect(result).toEqual(mockPreference);
      expect(prismaService.userHourPreferences.findUnique).toHaveBeenCalledWith({
        where: { uid: 'pref-uid-1' },
      });
    });

    it('should return null when preference not found', async () => {
      (prismaService.userHourPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne('non-existent-uid');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    const mockPreference = {
      uid: 'pref-uid-1',
      userUid: 'user-uid-1',
      dayOfWeek: 2,
      timePeriod: TimePeriod.MORNING,
      type: UserHourPreferenceType.RECURRENT,
      date: null,
      createdAt: mockCurrentDate,
      updatedAt: mockCurrentDate,
    };

    it('should delete a preference successfully', async () => {
      (prismaService.userHourPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreference);
      (prismaService.userHourPreferences.delete as jest.Mock).mockResolvedValue(mockPreference);

      await service.remove('pref-uid-1', 'user-uid-1');

      expect(prismaService.userHourPreferences.delete).toHaveBeenCalledWith({
        where: { uid: 'pref-uid-1' },
      });
      expect(logger.info).toHaveBeenCalledWith('Hour preference deleted: pref-uid-1');
    });

    it('should throw NotFoundException when preference does not exist', async () => {
      (prismaService.userHourPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('pref-uid-1', 'user-uid-1')).rejects.toThrow(
        new NotFoundException('Hour preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('Hour preference not found: pref-uid-1');
    });

    it('should throw NotFoundException when userUid does not match', async () => {
      (prismaService.userHourPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreference);

      await expect(service.remove('pref-uid-1', 'different-user-uid')).rejects.toThrow(
        new NotFoundException('Hour preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('Hour preference not found: pref-uid-1');
    });
  });
});

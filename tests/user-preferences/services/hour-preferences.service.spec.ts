import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { HourPreferenceData } from 'src/user-preferences/dto/input/create-hour-preference.dto';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';
import { UsersService } from 'src/users/users.service';

describe('HourPreferencesService', () => {
  let service: HourPreferencesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let logger: PinoLogger;

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');
  const mockFutureDate = new Date('2023-01-10T14:00:00Z');

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };
    const mockTx = {
      userHourPreferences: {
        create: jest.fn(),
      },
    };
    const mockPrismaService = {
      users: {
        findUnique: jest.fn(),
      },
      userHourPreferences: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)),
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

  describe('createMany', () => {
    const userUid = 'user-uid-1';
    const hourPreferences: HourPreferenceData[] = [
      {
        dayOfWeek: 2,
        timePeriod: TimePeriod.MORNING,
        type: UserHourPreferenceType.RECURRENT,
      },
      {
        timePeriod: TimePeriod.AFTERNOON,
        type: UserHourPreferenceType.ONE_TIME,
        date: mockFutureDate,
      },
    ];

    it('should clear preferences then create all valid hour preferences in a transaction', async () => {
      const mockTxCreate = jest.fn().mockResolvedValue({});
      (prismaService.$transaction as jest.Mock).mockImplementation((cb) =>
        cb({ userHourPreferences: { create: mockTxCreate } }),
      );

      await service.createMany(hourPreferences, userUid);

      expect(prismaService.userHourPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(mockTxCreate).toHaveBeenCalledTimes(2);
      expect(mockTxCreate).toHaveBeenNthCalledWith(1, {
        data: {
          date: undefined,
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
          userUid,
        },
      });
      expect(mockTxCreate).toHaveBeenNthCalledWith(2, {
        data: {
          date: expect.any(Date),
          dayOfWeek: undefined,
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          userUid,
        },
      });
    });

    it('should deduplicate RECURRENT preferences (same dayOfWeek + timePeriod)', async () => {
      const prefs: HourPreferenceData[] = [
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
      ];
      const mockTxCreate = jest.fn().mockResolvedValue({});
      (prismaService.$transaction as jest.Mock).mockImplementation((cb) =>
        cb({ userHourPreferences: { create: mockTxCreate } }),
      );

      await service.createMany(prefs, userUid);

      expect(mockTxCreate).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'Recurrent hour preference already exists, skipping',
      );
    });

    it('should skip ONE_TIME when covered by RECURRENT (same dayOfWeek + timePeriod)', async () => {
      const prefs: HourPreferenceData[] = [
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
        {
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.ONE_TIME,
          date: new Date('2023-01-10T14:00:00.000Z'), // Tuesday = day 2
        },
      ];
      const mockTxCreate = jest.fn().mockResolvedValue({});
      (prismaService.$transaction as jest.Mock).mockImplementation((cb) =>
        cb({ userHourPreferences: { create: mockTxCreate } }),
      );

      await service.createMany(prefs, userUid);

      expect(mockTxCreate).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'One-time hour preference covered by recurrent (dayOfWeek 2, MORNING), skipping',
      );
    });

    it('should deduplicate ONE_TIME preferences (same date + timePeriod)', async () => {
      const dateStr = mockFutureDate.toISOString();
      const prefs: HourPreferenceData[] = [
        {
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          date: new Date(dateStr),
        },
        {
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          date: new Date(dateStr),
        },
      ];
      const mockTxCreate = jest.fn().mockResolvedValue({});
      (prismaService.$transaction as jest.Mock).mockImplementation((cb) =>
        cb({ userHourPreferences: { create: mockTxCreate } }),
      );

      await service.createMany(prefs, userUid);

      expect(mockTxCreate).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith('One-time hour preference already exists, skipping');
    });

    it('should log when submitted count differs from valid count', async () => {
      const prefs: HourPreferenceData[] = [
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
      ];
      const mockTxCreate = jest.fn().mockResolvedValue({});
      (prismaService.$transaction as jest.Mock).mockImplementation((cb) =>
        cb({ userHourPreferences: { create: mockTxCreate } }),
      );

      await service.createMany(prefs, userUid);

      expect(logger.warn).toHaveBeenCalledWith(
        '2 hour preferences submitted, but 1 are valid, skipping',
      );
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

      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({ uid: mockUser.uid });
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
          date: true,
          dayOfWeek: true,
          timePeriod: true,
          type: true,
        },
        where: {
          OR: [
            { type: UserHourPreferenceType.RECURRENT, userUid: 'user-uid-1' },
            { date: { gt: expect.any(Date) }, userUid: 'user-uid-1' },
          ],
        },
      });
    });

    it('should return empty array when user has no preferences', async () => {
      (prismaService.users.findUnique as jest.Mock).mockResolvedValue({ uid: mockUser.uid });
      (prismaService.userHourPreferences.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid('user-uid-1');

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prismaService.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findAllByUserUid('user-uid-1')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('User not found: user-uid-1');
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

  describe('clearPreferences', () => {
    it('should delete all hour preferences for the user', async () => {
      (prismaService.userHourPreferences.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.clearPreferences('user-uid-1');

      expect(prismaService.userHourPreferences.deleteMany).toHaveBeenCalledWith({
        where: { userUid: 'user-uid-1' },
      });
      expect(logger.debug).toHaveBeenCalledWith('user-uid-1 hour preferences cleared');
    });
  });
});

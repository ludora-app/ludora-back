import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TimePeriod, UserHourPreferenceType } from '@prisma/client';
import { UserHourPreferencesController } from '../../src/user-hour-preferences/user-hour-preferences.controller';
import { UserHourPreferencesService } from '../../src/user-hour-preferences/user-hour-preferences.service';
import { CreateUserHourPreferenceDto } from '../../src/user-hour-preferences/dto/input/create-user-hour-preference.dto';

describe('UserHourPreferencesController', () => {
  let controller: UserHourPreferencesController;
  let service: UserHourPreferencesService;

  const mockUserHourPreferencesService = {
    findAllByUserUid: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');
  const mockFutureDate = new Date('2023-01-10T14:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserHourPreferencesController],
      providers: [
        { provide: UserHourPreferencesService, useValue: mockUserHourPreferencesService },
      ],
    }).compile();

    controller = module.get<UserHourPreferencesController>(UserHourPreferencesController);
    service = module.get<UserHourPreferencesService>(UserHourPreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    describe('RECURRENT preference', () => {
      const createRecurrentDto: CreateUserHourPreferenceDto = {
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

        mockUserHourPreferencesService.create.mockResolvedValue(mockCreatedPreference);

        const result = await controller.create(mockRequest, createRecurrentDto);

        expect(result).toEqual({
          data: mockCreatedPreference,
          message: 'User hour preference created successfully',
        });
        expect(service.create).toHaveBeenCalledWith('user-uid-1', createRecurrentDto);
      });

      it('should propagate NotFoundException from service', async () => {
        mockUserHourPreferencesService.create.mockRejectedValue(
          new NotFoundException('User not found'),
        );

        await expect(controller.create(mockRequest, createRecurrentDto)).rejects.toThrow(
          NotFoundException,
        );
        expect(service.create).toHaveBeenCalledWith('user-uid-1', createRecurrentDto);
      });

      it('should propagate BadRequestException when preference already exists', async () => {
        mockUserHourPreferencesService.create.mockRejectedValue(
          new BadRequestException('An hour preference already exists for this day and time period'),
        );

        await expect(controller.create(mockRequest, createRecurrentDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(service.create).toHaveBeenCalledWith('user-uid-1', createRecurrentDto);
      });
    });

    describe('ONE_TIME preference', () => {
      const createOneTimeDto: CreateUserHourPreferenceDto = {
        timePeriod: TimePeriod.AFTERNOON,
        preferenceType: UserHourPreferenceType.ONE_TIME,
        date: mockFutureDate.toISOString(),
      };

      it('should create a one-time hour preference successfully', async () => {
        const mockCreatedPreference = {
          uid: 'pref-uid-2',
          userUid: 'user-uid-1',
          dayOfWeek: 2,
          timePeriod: TimePeriod.AFTERNOON,
          type: UserHourPreferenceType.ONE_TIME,
          date: mockFutureDate,
          createdAt: mockCurrentDate,
          updatedAt: mockCurrentDate,
        };

        mockUserHourPreferencesService.create.mockResolvedValue(mockCreatedPreference);

        const result = await controller.create(mockRequest, createOneTimeDto);

        expect(result).toEqual({
          data: mockCreatedPreference,
          message: 'User hour preference created successfully',
        });
        expect(service.create).toHaveBeenCalledWith('user-uid-1', createOneTimeDto);
      });

      it('should propagate BadRequestException when date is in the past', async () => {
        mockUserHourPreferencesService.create.mockRejectedValue(
          new BadRequestException('The date is in the past'),
        );

        await expect(controller.create(mockRequest, createOneTimeDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(service.create).toHaveBeenCalledWith('user-uid-1', createOneTimeDto);
      });
    });
  });

  describe('findAllByUserUid', () => {
    const userUid = 'user-uid-1';

    it('should return all hour preferences for a user', async () => {
      const mockPreferences = {
        items: [
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
        ],
        nextCursor: null,
        totalCount: 2,
      };

      mockUserHourPreferencesService.findAllByUserUid.mockResolvedValue(mockPreferences);

      const result = await controller.findAllByUserUid(userUid);

      expect(result).toEqual({
        data: mockPreferences,
        message: 'User hour preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith(userUid);
    });

    it('should return empty array when user has no preferences', async () => {
      const mockEmptyPreferences = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockUserHourPreferencesService.findAllByUserUid.mockResolvedValue(mockEmptyPreferences);

      const result = await controller.findAllByUserUid(userUid);

      expect(result).toEqual({
        data: mockEmptyPreferences,
        message: 'User hour preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith(userUid);
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      mockUserHourPreferencesService.findAllByUserUid.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findAllByUserUid('non-existent-uid')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findAllByUserUid).toHaveBeenCalledWith('non-existent-uid');
    });
  });

  describe('remove', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;
    const preferenceUid = 'pref-uid-1';

    it('should remove a preference successfully', async () => {
      mockUserHourPreferencesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(preferenceUid, mockRequest);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(preferenceUid, 'user-uid-1');
    });

    it('should propagate NotFoundException when preference does not exist', async () => {
      mockUserHourPreferencesService.remove.mockRejectedValue(
        new NotFoundException('Hour preference not found'),
      );

      await expect(controller.remove('non-existent-uid', mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith('non-existent-uid', 'user-uid-1');
    });

    it('should propagate NotFoundException when userUid does not match', async () => {
      mockUserHourPreferencesService.remove.mockRejectedValue(
        new NotFoundException('Hour preference not found'),
      );

      await expect(controller.remove(preferenceUid, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(preferenceUid, 'user-uid-1');
    });
  });
});

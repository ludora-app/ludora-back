import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { HourPreferencesController } from 'src/user-preferences/controllers/hour-preferences.controller';
import { CreateHourPreferenceDto } from 'src/user-preferences/dto/input/create-hour-preference.dto';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';

describe('HourPreferencesController', () => {
  let controller: HourPreferencesController;
  let service: HourPreferencesService;

  const mockHourPreferencesService = {
    findAllByUserUid: jest.fn(),
    createMany: jest.fn(),
    clearPreferences: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');
  const mockFutureDate = new Date('2023-01-10T14:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HourPreferencesController],
      providers: [{ provide: HourPreferencesService, useValue: mockHourPreferencesService }],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<HourPreferencesController>(HourPreferencesController);
    service = module.get<HourPreferencesService>(HourPreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMyHourPreferences', () => {
    const mockRequest = { user: { uid: 'user-uid-1' } } as any;

    it('should return hour preferences for the connected user', async () => {
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
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockHourPreferencesService.findAllByUserUid.mockResolvedValue(mockPreferences);

      const result = await controller.findMyHourPreferences(mockRequest);

      expect(result).toEqual({
        data: mockPreferences,
        message: 'User hour preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1');
    });

    it('should return data null and specific message when user has no preferences', async () => {
      const mockEmptyPreferences = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockHourPreferencesService.findAllByUserUid.mockResolvedValue(mockEmptyPreferences);

      const result = await controller.findMyHourPreferences(mockRequest);

      expect(result).toEqual({
        data: null,
        message: 'User does not have any hour preferences yet',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1');
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      mockHourPreferencesService.findAllByUserUid.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findMyHourPreferences(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1');
    });
  });

  describe('createMany', () => {
    const mockRequest = { user: { uid: 'user-uid-1' } } as any;
    const createHourPreferenceDto: CreateHourPreferenceDto = {
      hourPreferences: [
        {
          dayOfWeek: 2,
          timePeriod: TimePeriod.MORNING,
          type: UserHourPreferenceType.RECURRENT,
        },
      ],
    };

    it('should call service createMany and return void', async () => {
      mockHourPreferencesService.createMany.mockResolvedValue(undefined);

      const result = await controller.createMany(mockRequest, createHourPreferenceDto);

      expect(result).toBeUndefined();
      expect(service.createMany).toHaveBeenCalledWith(
        createHourPreferenceDto.hourPreferences,
        'user-uid-1',
      );
    });

    it('should propagate exceptions from service', async () => {
      mockHourPreferencesService.createMany.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.createMany(mockRequest, createHourPreferenceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.createMany).toHaveBeenCalledWith(
        createHourPreferenceDto.hourPreferences,
        'user-uid-1',
      );
    });
  });

  describe('remove', () => {
    const mockRequest = { user: { uid: 'user-uid-1' } } as any;

    it('should clear all hour preferences for the connected user and return void', async () => {
      mockHourPreferencesService.clearPreferences.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest);

      expect(result).toBeUndefined();
      expect(service.clearPreferences).toHaveBeenCalledWith('user-uid-1');
    });

    it('should propagate exceptions from service', async () => {
      mockHourPreferencesService.clearPreferences.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.remove(mockRequest)).rejects.toThrow(NotFoundException);
      expect(service.clearPreferences).toHaveBeenCalledWith('user-uid-1');
    });
  });
});

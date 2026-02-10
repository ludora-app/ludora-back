import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserSportPreferences } from 'generated/prisma/browser';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { SportPreferencesController } from 'src/user-preferences/controllers/sport-preferences.controller';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';
import { CreateSportPreferenceDto } from 'src/user-preferences/dto/input/create-sport-preference.dto';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { GameModes } from 'generated/prisma/enums';

describe('SportPreferencesController', () => {
  let controller: SportPreferencesController;
  let service: SportPreferencesService;

  const mockUserSportPreferencesService = {
    createManyWithGameModes: jest.fn(),
    findAllByUserUid: jest.fn(),
    clearPreferences: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportPreferencesController],
      providers: [{ provide: SportPreferencesService, useValue: mockUserSportPreferencesService }],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SportPreferencesController>(SportPreferencesController);
    service = module.get<SportPreferencesService>(SportPreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createManyWithGameModes', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    it('should call service.createManyWithGameModes with dto.sportPreferences and user uid', async () => {
      const dto: CreateSportPreferenceDto = {
        sportPreferences: [
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
        ],
      };

      mockUserSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createManyWithGameModes(mockRequest, dto);

      expect(service.createManyWithGameModes).toHaveBeenCalledTimes(1);
      expect(service.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        'user-uid-1',
      );
    });

    it('should extract userUid from request and pass to service', async () => {
      const dto: CreateSportPreferenceDto = {
        sportPreferences: [
          {
            sport: Sport.FOOTBALL,
            level: UserSportLevel.BEGINNER,
            gameModes: [GameModes.ELEVEN_V_ELEVEN],
          },
        ],
      };

      const differentMockRequest = {
        user: { uid: 'another-user-uid' },
      } as any;

      mockUserSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createManyWithGameModes(differentMockRequest, dto);

      expect(service.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        'another-user-uid',
      );
    });

    it('should propagate BadRequestException when service throws', async () => {
      const dto: CreateSportPreferenceDto = {
        sportPreferences: [
          { sport: Sport.BASKETBALL, level: UserSportLevel.BEGINNER, gameModes: [] },
          { sport: Sport.BASKETBALL, level: UserSportLevel.INTERMEDIATE, gameModes: [] },
        ],
      };

      mockUserSportPreferencesService.createManyWithGameModes.mockRejectedValue(
        new BadRequestException('Each sport preference must have a unique sport.'),
      );

      await expect(controller.createManyWithGameModes(mockRequest, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        'user-uid-1',
      );
    });

    it('should resolve with void when service succeeds', async () => {
      const dto: CreateSportPreferenceDto = {
        sportPreferences: [
          {
            sport: Sport.TENNIS,
            level: UserSportLevel.ADVANCED,
            gameModes: [GameModes.ONE_V_ONE],
          },
        ],
      };

      mockUserSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      const result = await controller.createManyWithGameModes(mockRequest, dto);

      expect(result).toBeUndefined();
    });
  });

  describe('findAllByUserUid', () => {
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

      const paginatedResponse = {
        items: mockPreferences,
        nextCursor: null,
        totalCount: mockPreferences.length,
      };

      mockUserSportPreferencesService.findAllByUserUid.mockResolvedValue(paginatedResponse);

      const result = await controller.findAllByUserUid(userUid);

      expect(result).toEqual({
        data: paginatedResponse,
        message: 'User sport preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith(userUid);
    });

    it('should return empty array when user has no sport preferences', async () => {
      const emptyPaginatedResponse = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };

      mockUserSportPreferencesService.findAllByUserUid.mockResolvedValue(emptyPaginatedResponse);

      const result = await controller.findAllByUserUid(userUid);

      expect(result).toEqual({
        data: emptyPaginatedResponse,
        message: 'User sport preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith(userUid);
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      mockUserSportPreferencesService.findAllByUserUid.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findAllByUserUid('non-existent-uid')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findAllByUserUid).toHaveBeenCalledWith('non-existent-uid');
    });

    it('should handle different user UIDs', async () => {
      const userIds = ['user-uid-1', 'user-uid-2', 'user-uid-3'];

      for (const uid of userIds) {
        const mockPreferences: UserSportPreferences[] = [
          {
            uid: `sport-pref-${uid}`,
            sport: Sport.BASKETBALL,
            userUid: uid,
            createdAt: mockCurrentDate,
            level: UserSportLevel.BEGINNER,
          },
        ];

        const paginatedResponse = {
          items: mockPreferences,
          nextCursor: null,
          totalCount: mockPreferences.length,
        };

        mockUserSportPreferencesService.findAllByUserUid.mockResolvedValue(paginatedResponse);

        const result = await controller.findAllByUserUid(uid);

        expect(result).toEqual({
          data: paginatedResponse,
          message: 'User sport preferences fetched successfully',
        });
        expect(service.findAllByUserUid).toHaveBeenCalledWith(uid);

        jest.clearAllMocks();
      }
    });
  });

  describe('remove', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    it('should call service.clearPreferences with user uid from request', async () => {
      mockUserSportPreferencesService.clearPreferences.mockResolvedValue(undefined);

      await controller.remove(mockRequest);

      expect(service.clearPreferences).toHaveBeenCalledTimes(1);
      expect(service.clearPreferences).toHaveBeenCalledWith('user-uid-1');
    });

    it('should extract userUid from request object', async () => {
      const differentMockRequest = {
        user: { uid: 'different-user-uid' },
      } as any;

      mockUserSportPreferencesService.clearPreferences.mockResolvedValue(undefined);

      await controller.remove(differentMockRequest);

      expect(service.clearPreferences).toHaveBeenCalledWith('different-user-uid');
    });
  });
});

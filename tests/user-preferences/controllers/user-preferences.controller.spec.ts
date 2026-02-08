import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { GameModes } from 'generated/prisma/enums';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { UserPreferencesController } from 'src/user-preferences/controllers/user-preferences.controller';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';
import { GameModePreferencesService } from 'src/user-preferences/services/game-mode-preferences.service';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { CreateAllPreferencesDto } from 'src/user-preferences/dto/input/create-all-preferences.dto';

describe('UserPreferencesController', () => {
  let controller: UserPreferencesController;
  let sportService: SportPreferencesService;

  const mockSportPreferencesService = {
    createManyWithGameModes: jest.fn(),
  };

  const mockHourPreferencesService = {};

  const mockGameModePreferencesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPreferencesController],
      providers: [
        { provide: SportPreferencesService, useValue: mockSportPreferencesService },
        { provide: HourPreferencesService, useValue: mockHourPreferencesService },
        { provide: GameModePreferencesService, useValue: mockGameModePreferencesService },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserPreferencesController>(UserPreferencesController);
    sportService = module.get<SportPreferencesService>(SportPreferencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAllPreferences', () => {
    const userUid = 'user-uid-123';
    const mockRequest = {
      user: { uid: userUid },
    } as unknown as FastifyRequest;

    it('should create all preferences successfully with multiple sports', async () => {
      const dto: CreateAllPreferencesDto = {
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

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(mockRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
      expect(sportService.createManyWithGameModes).toHaveBeenCalledTimes(1);
    });

    it('should create preferences with a single sport', async () => {
      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.FOOTBALL,
            level: UserSportLevel.BEGINNER,
            gameModes: [GameModes.ELEVEN_V_ELEVEN],
          },
        ],
      };

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(mockRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
    });

    it('should handle sport with multiple game modes', async () => {
      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.BASKETBALL,
            level: UserSportLevel.INTERMEDIATE,
            gameModes: [GameModes.FIVE_V_FIVE, GameModes.THREE_V_THREE, GameModes.ONE_V_ONE],
          },
        ],
      };

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(mockRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
    });

    it('should handle sport with empty game modes array', async () => {
      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.TENNIS,
            level: UserSportLevel.ADVANCED,
            gameModes: [],
          },
        ],
      };

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(mockRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
    });

    it('should extract userUid from request correctly', async () => {
      const differentUserUid = 'different-user-uid-456';
      const differentRequest = {
        user: { uid: differentUserUid },
      } as unknown as FastifyRequest;

      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.BASKETBALL,
            level: UserSportLevel.INTERMEDIATE,
            gameModes: [GameModes.FIVE_V_FIVE],
          },
        ],
      };

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(differentRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        differentUserUid,
      );
    });

    it('should propagate errors from service', async () => {
      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.BASKETBALL,
            level: UserSportLevel.INTERMEDIATE,
            gameModes: [GameModes.FIVE_V_FIVE],
          },
        ],
      };

      const error = new Error('Database error');
      mockSportPreferencesService.createManyWithGameModes.mockRejectedValue(error);

      await expect(controller.createAllPreferences(mockRequest, dto)).rejects.toThrow(error);
      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
    });

    it('should handle multiple sports with different levels', async () => {
      const dto: CreateAllPreferencesDto = {
        sportPreferences: [
          {
            sport: Sport.BASKETBALL,
            level: UserSportLevel.BEGINNER,
            gameModes: [GameModes.FIVE_V_FIVE],
          },
          {
            sport: Sport.FOOTBALL,
            level: UserSportLevel.INTERMEDIATE,
            gameModes: [GameModes.ELEVEN_V_ELEVEN],
          },
          {
            sport: Sport.TENNIS,
            level: UserSportLevel.ADVANCED,
            gameModes: [GameModes.ONE_V_ONE],
          },
        ],
      };

      mockSportPreferencesService.createManyWithGameModes.mockResolvedValue(undefined);

      await controller.createAllPreferences(mockRequest, dto);

      expect(sportService.createManyWithGameModes).toHaveBeenCalledWith(
        dto.sportPreferences,
        userUid,
      );
    });
  });
});

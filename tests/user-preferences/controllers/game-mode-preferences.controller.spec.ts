import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { GameModePreferencesController } from 'src/user-preferences/controllers/game-mode-preferences.controller';
import { GameModePreferencesService } from 'src/user-preferences/services/game-mode-preferences.service';
import { CreateGameModePreferencesDtoFromRequest } from 'src/user-preferences/dto/input/create-game-mode-preferences.dto';
import { UpdateGameModePreferenceDto } from 'src/user-preferences/dto/input/update-game-mode-preference.dto';

describe('GameModePreferencesController', () => {
  let controller: GameModePreferencesController;
  let service: GameModePreferencesService;

  const mockGameModePreferencesService = {
    create: jest.fn(),
    findAllByUserUid: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameModePreferencesController],
      providers: [
        { provide: GameModePreferencesService, useValue: mockGameModePreferencesService },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<GameModePreferencesController>(GameModePreferencesController);
    service = module.get<GameModePreferencesService>(GameModePreferencesService);
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

    it('should create a game mode preference successfully', async () => {
      const createDto: CreateGameModePreferencesDtoFromRequest = {
        gameMode: GameModes.THREE_V_THREE,
        sport: Sport.BASKETBALL,
      };
      const mockCreatedPreference = {
        uid: 'game-mode-pref-uid-1',
        gameMode: createDto.gameMode,
        sport: createDto.sport,
        createdAt: mockCurrentDate,
      };

      mockGameModePreferencesService.create.mockResolvedValue(mockCreatedPreference);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual({
        data: mockCreatedPreference,
        message: 'User game mode preference created successfully',
      });
      expect(service.create).toHaveBeenCalledWith({ ...createDto, userUid: 'user-uid-1' });
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      const createDto: CreateGameModePreferencesDtoFromRequest = {
        gameMode: GameModes.THREE_V_THREE,
        sport: Sport.BASKETBALL,
      };

      mockGameModePreferencesService.create.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, userUid: 'user-uid-1' });
    });

    it('should propagate BadRequestException when preference already exists', async () => {
      const createDto: CreateGameModePreferencesDtoFromRequest = {
        gameMode: GameModes.THREE_V_THREE,
        sport: Sport.BASKETBALL,
      };

      mockGameModePreferencesService.create.mockRejectedValue(
        new BadRequestException('Game mode preference already exists'),
      );

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith({ ...createDto, userUid: 'user-uid-1' });
    });
  });

  describe('findMyGameModePreferences', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    it('should return game mode preferences for the connected user', async () => {
      const mockPreferences = {
        items: [
          {
            uid: 'game-mode-pref-uid-1',
            gameMode: GameModes.THREE_V_THREE,
            sport: Sport.BASKETBALL,
            createdAt: mockCurrentDate,
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockGameModePreferencesService.findAllByUserUid.mockResolvedValue(mockPreferences);

      const result = await controller.findMyGameModePreferences(mockRequest);

      expect(result).toEqual({
        data: mockPreferences,
        message: 'User game mode preferences fetched successfully',
      });
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1');
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      mockGameModePreferencesService.findAllByUserUid.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findMyGameModePreferences(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findAllByUserUid).toHaveBeenCalledWith('user-uid-1');
    });
  });

  describe('update', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;
    const updateDto: UpdateGameModePreferenceDto = {
      gameMode: GameModes.FIVE_V_FIVE,
      sport: Sport.FOOTBALL,
    };

    it('should update a game mode preference successfully', async () => {
      mockGameModePreferencesService.update.mockResolvedValue(undefined);

      const result = await controller.update('game-mode-pref-uid-1', updateDto, mockRequest);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith('game-mode-pref-uid-1', 'user-uid-1', updateDto);
    });

    it('should propagate NotFoundException when preference does not exist', async () => {
      mockGameModePreferencesService.update.mockRejectedValue(
        new NotFoundException('Game mode preference not found'),
      );

      await expect(controller.update('non-existent-uid', updateDto, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.update).toHaveBeenCalledWith('non-existent-uid', 'user-uid-1', updateDto);
    });
  });

  describe('remove', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    it('should remove a game mode preference successfully', async () => {
      mockGameModePreferencesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('game-mode-pref-uid-1', mockRequest);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('game-mode-pref-uid-1', 'user-uid-1');
    });

    it('should propagate NotFoundException when preference does not exist', async () => {
      mockGameModePreferencesService.remove.mockRejectedValue(
        new NotFoundException('Game mode preference not found'),
      );

      await expect(controller.remove('non-existent-uid', mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith('non-existent-uid', 'user-uid-1');
    });
  });
});

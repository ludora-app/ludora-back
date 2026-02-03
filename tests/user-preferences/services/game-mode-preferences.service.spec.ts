import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { Sport } from 'src/shared/constants/constants';
import { GameModes } from 'generated/prisma/enums';

import { CreateGameModePreferencesDto } from 'src/user-preferences/dto/input/create-game-mode-preferences.dto';
import { UpdateGameModePreferenceDto } from 'src/user-preferences/dto/input/update-game-mode-preference.dto';
import { GameModePreferencesService } from 'src/user-preferences/services/game-mode-preferences.service';

describe('GameModePreferencesService', () => {
  let service: GameModePreferencesService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let logger: PinoLogger;

  const mockCurrentDate = new Date('2023-01-01T12:00:00Z');

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };
    const mockPrismaService = {
      userGameModePreferences: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userSportPreferences: {
        findFirst: jest.fn(),
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
        GameModePreferencesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<GameModePreferencesService>(GameModePreferencesService);
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
    const userUid = 'user-uid-1';
    const dto: CreateGameModePreferencesDto = {
      gameMode: GameModes.THREE_V_THREE,
      sport: Sport.BASKETBALL,
      userUid,
    };

    it('should create a game mode preference successfully', async () => {
      const mockUser = { uid: userUid, email: 'test@example.com' };
      const mockCreatedPreference = {
        uid: 'game-mode-pref-uid-1',
        gameMode: dto.gameMode,
        sport: dto.sport,
        createdAt: mockCurrentDate,
      };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue({
        uid: 'sport-pref-uid-1',
        sport: dto.sport,
        userUid,
      });
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.userGameModePreferences.create as jest.Mock).mockResolvedValue(
        mockCreatedPreference,
      );

      const result = await service.create(dto);

      expect(result).toEqual(mockCreatedPreference);
      expect(usersService.findOne).toHaveBeenCalledWith(userUid, expect.any(Object));
      expect(prismaService.userSportPreferences.findFirst).toHaveBeenCalledWith({
        where: { sport: dto.sport, userUid },
      });
      expect(prismaService.userGameModePreferences.findFirst).toHaveBeenCalledWith({
        where: { gameMode: dto.gameMode, sport: dto.sport, userUid },
      });
      expect(prismaService.userGameModePreferences.create).toHaveBeenCalledWith({
        data: { gameMode: dto.gameMode, sport: dto.sport, userUid },
        select: {
          createdAt: true,
          gameMode: true,
          sport: true,
          uid: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(new NotFoundException('User not found'));
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userSportPreferences.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when sport preference does not exist', async () => {
      const mockUser = { uid: userUid, email: 'test@example.com' };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'You must set a sport preference before setting a game mode preference',
        ),
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Sport preference not found: ${dto.sport} for user: ${userUid}`,
      );
      expect(prismaService.userGameModePreferences.findFirst).not.toHaveBeenCalled();
      expect(prismaService.userGameModePreferences.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when game mode preference already exists', async () => {
      const mockUser = { uid: userUid, email: 'test@example.com' };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userSportPreferences.findFirst as jest.Mock).mockResolvedValue({
        uid: 'sport-pref-uid-1',
        sport: dto.sport,
        userUid,
      });
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue({
        uid: 'game-mode-pref-uid-1',
        gameMode: dto.gameMode,
        sport: dto.sport,
        userUid,
      });

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Game mode preference already exists'),
      );
      expect(logger.error).toHaveBeenCalledWith(
        `Game mode preference already exists: ${dto.gameMode} for user: ${userUid}`,
      );
      expect(prismaService.userGameModePreferences.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllByUserUid', () => {
    const userUid = 'user-uid-1';

    it('should return all game mode preferences for a user', async () => {
      const mockUser = { uid: userUid, email: 'test@example.com' };
      const mockPreferences = [
        {
          uid: 'game-mode-pref-uid-1',
          gameMode: GameModes.THREE_V_THREE,
          sport: Sport.BASKETBALL,
          createdAt: mockCurrentDate,
        },
      ];

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userGameModePreferences.findMany as jest.Mock).mockResolvedValue(
        mockPreferences,
      );

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({
        items: mockPreferences,
        nextCursor: null,
        totalCount: mockPreferences.length,
      });
      expect(prismaService.userGameModePreferences.findMany).toHaveBeenCalledWith({
        select: {
          createdAt: true,
          gameMode: true,
          sport: true,
          uid: true,
        },
        where: { userUid },
      });
    });

    it('should return empty array when user has no game mode preferences', async () => {
      const mockUser = { uid: userUid, email: 'test@example.com' };

      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.userGameModePreferences.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUserUid(userUid);

      expect(result).toEqual({ items: [], nextCursor: null, totalCount: 0 });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findAllByUserUid(userUid)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`User not found: ${userUid}`);
      expect(prismaService.userGameModePreferences.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const uid = 'game-mode-pref-uid-1';
    const userUid = 'user-uid-1';
    const updateDto: UpdateGameModePreferenceDto = {
      gameMode: GameModes.FIVE_V_FIVE,
      sport: Sport.FOOTBALL,
    };

    it('should update a game mode preference successfully', async () => {
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue({
        uid,
        userUid,
      });

      await service.update(uid, userUid, updateDto);

      expect(prismaService.userGameModePreferences.update).toHaveBeenCalledWith({
        data: { gameMode: updateDto.gameMode, sport: updateDto.sport },
        where: { uid, userUid },
      });
    });

    it('should throw NotFoundException when game mode preference does not exist', async () => {
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update(uid, userUid, updateDto)).rejects.toThrow(
        new NotFoundException('Game mode preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Game mode preference not found: ${uid}`);
      expect(prismaService.userGameModePreferences.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const uid = 'game-mode-pref-uid-1';
    const userUid = 'user-uid-1';

    it('should delete a game mode preference successfully', async () => {
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue({
        uid,
        userUid,
      });

      await service.remove(uid, userUid);

      expect(prismaService.userGameModePreferences.delete).toHaveBeenCalledWith({
        where: { uid, userUid },
      });
      expect(logger.debug).toHaveBeenCalledWith(`Game mode preference deleted: ${uid}`);
    });

    it('should throw NotFoundException when game mode preference does not exist', async () => {
      (prismaService.userGameModePreferences.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(uid, userUid)).rejects.toThrow(
        new NotFoundException('Game mode preference not found'),
      );
      expect(logger.error).toHaveBeenCalledWith(`Game mode preference not found: ${uid}`);
      expect(prismaService.userGameModePreferences.delete).not.toHaveBeenCalled();
    });
  });
});

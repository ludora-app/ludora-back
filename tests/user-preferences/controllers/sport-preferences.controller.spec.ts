import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserSports } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { SportPreferencesController } from 'src/user-preferences/controllers/sport-preferences.controller';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';
import { CreateSportPreferenceDto } from 'src/user-preferences/dto/input/create-sport-preference.dto';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';

describe('SportPreferencesController', () => {
  let controller: SportPreferencesController;
  let service: SportPreferencesService;

  const mockUserSportPreferencesService = {
    create: jest.fn(),
    findAllByUserUid: jest.fn(),
    remove: jest.fn(),
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

  describe('create', () => {
    const mockRequest = {
      user: { uid: 'user-uid-1' },
    } as any;

    it('should create a sport preference successfully', async () => {
      const createDto: CreateSportPreferenceDto = {
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      };

      const mockCreatedPreference: UserSports = {
        uid: 'sport-pref-uid-1',
        sport: Sport.BASKETBALL,
        userUid: 'user-uid-1',
        createdAt: mockCurrentDate,
        level: UserSportLevel.BEGINNER,
      };

      mockUserSportPreferencesService.create.mockResolvedValue(mockCreatedPreference);

      const result = await controller.create(createDto, mockRequest);

      expect(result).toEqual({
        data: mockCreatedPreference,
        message: 'User sport preference created successfully',
      });
      expect(service.create).toHaveBeenCalledWith({
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      });
    });

    it('should create sport preferences for different sports', async () => {
      const sports = [Sport.BASKETBALL, Sport.FOOTBALL, Sport.TENNIS, Sport.VOLLEYBALL];

      for (const sport of sports) {
        const createDto: CreateSportPreferenceDto = {
          sport,
          level: UserSportLevel.BEGINNER,
          userUid: 'user-uid-1',
        };

        const mockCreatedPreference: UserSports = {
          uid: `sport-pref-uid-${sport}`,
          sport,
          userUid: 'user-uid-1',
          createdAt: mockCurrentDate,
          level: UserSportLevel.BEGINNER,
        };

        mockUserSportPreferencesService.create.mockResolvedValue(mockCreatedPreference);

        const result = await controller.create(createDto, mockRequest);

        expect(result).toEqual({
          data: mockCreatedPreference,
          message: 'User sport preference created successfully',
        });
        expect(service.create).toHaveBeenCalledWith({
          sport,
          level: UserSportLevel.BEGINNER,
          userUid: 'user-uid-1',
        });

        jest.clearAllMocks();
      }
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      const createDto: CreateSportPreferenceDto = {
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      };

      mockUserSportPreferencesService.create.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith({
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      });
    });

    it('should propagate BadRequestException when sport preference already exists', async () => {
      const createDto: CreateSportPreferenceDto = {
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      };

      mockUserSportPreferencesService.create.mockRejectedValue(
        new BadRequestException('Sport preference already exists'),
      );

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith({
        sport: Sport.BASKETBALL,
        level: UserSportLevel.BEGINNER,
        userUid: 'user-uid-1',
      });
    });

    it('should extract userUid from request object', async () => {
      const createDto: CreateSportPreferenceDto = {
        sport: Sport.FOOTBALL,
        level: UserSportLevel.INTERMEDIATE,
        userUid: 'different-user-uid',
      };

      const differentMockRequest = {
        user: { uid: 'different-user-uid' },
      } as any;

      const mockCreatedPreference: UserSports = {
        uid: 'sport-pref-uid-2',
        sport: Sport.FOOTBALL,
        userUid: 'different-user-uid',
        createdAt: mockCurrentDate,
        level: UserSportLevel.INTERMEDIATE,
      };

      mockUserSportPreferencesService.create.mockResolvedValue(mockCreatedPreference);

      await controller.create(createDto, differentMockRequest);

      expect(service.create).toHaveBeenCalledWith({
        sport: Sport.FOOTBALL,
        level: UserSportLevel.INTERMEDIATE,
        userUid: 'different-user-uid',
      });
    });
  });

  describe('findAllByUserUid', () => {
    const userUid = 'user-uid-1';

    it('should return all sport preferences for a user', async () => {
      const mockPreferences: UserSports[] = [
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
        const mockPreferences: UserSports[] = [
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
    const sportPreferenceUid = 'sport-pref-uid-1';

    it('should remove a sport preference successfully', async () => {
      mockUserSportPreferencesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(sportPreferenceUid, mockRequest);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(sportPreferenceUid, 'user-uid-1');
    });

    it('should propagate NotFoundException when sport preference does not exist', async () => {
      mockUserSportPreferencesService.remove.mockRejectedValue(
        new NotFoundException('Sport preference not found'),
      );

      await expect(controller.remove('non-existent-uid', mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith('non-existent-uid', 'user-uid-1');
    });

    it('should propagate NotFoundException when userUid does not match', async () => {
      mockUserSportPreferencesService.remove.mockRejectedValue(
        new NotFoundException('Sport preference not found'),
      );

      await expect(controller.remove(sportPreferenceUid, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(sportPreferenceUid, 'user-uid-1');
    });

    it('should extract userUid from request object', async () => {
      const differentMockRequest = {
        user: { uid: 'different-user-uid' },
      } as any;

      mockUserSportPreferencesService.remove.mockResolvedValue(undefined);

      await controller.remove(sportPreferenceUid, differentMockRequest);

      expect(service.remove).toHaveBeenCalledWith(sportPreferenceUid, 'different-user-uid');
    });

    it('should handle removal of multiple sport preferences', async () => {
      const sportPreferenceUids = ['sport-pref-uid-1', 'sport-pref-uid-2', 'sport-pref-uid-3'];

      for (const uid of sportPreferenceUids) {
        mockUserSportPreferencesService.remove.mockResolvedValue(undefined);

        await controller.remove(uid, mockRequest);

        expect(service.remove).toHaveBeenCalledWith(uid, 'user-uid-1');

        jest.clearAllMocks();
      }
    });
  });
});

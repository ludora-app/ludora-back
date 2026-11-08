import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'generated/prisma/client';
import { GameModes, InvitationStatus, TimePeriod } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionSportLevel, Sport } from 'src/shared/constants/constants';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UserLookupService } from 'src/users/services/user-lookup.service';

describe('UserLookupService', () => {
  let service: UserLookupService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    fields: {
      findUnique: jest.fn(),
    },
    sessions: {
      findUnique: jest.fn(),
    },
    userBlocks: {
      findFirst: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLookupService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UserLookupService>(UserLookupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    const select = {
      bio: true,
      firstname: true,
      imageUrl: true,
      lastname: true,
      name: true,
      uid: true,
    };

    const mockUser = {
      email: 'test@test.com',
      firstname: 'John',
      uid: '1',
    };

    it('should return a user if found and no searcherUid provided', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findOne('1', select);

      expect(result).toBeDefined();
      expect(result.uid).toBe('1');
      expect(mockPrismaService.userBlocks.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      const result = await service.findOne('unknown-uid', select);

      expect(result).toBeNull();
      expect(mockPrismaService.userBlocks.findFirst).not.toHaveBeenCalled();
    });

    it('should return user when searcherUid provided and no block exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.userBlocks.findFirst.mockResolvedValueOnce(null);

      const result = await service.findOne('1', select, 'searcher-uid');

      expect(result).toBeDefined();
      expect(result.uid).toBe('1');
      expect(mockPrismaService.userBlocks.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { blockerUid: 'searcher-uid', blockedUid: '1' },
            { blockerUid: '1', blockedUid: 'searcher-uid' },
          ],
        },
      });
    });

    it('should return null when searcher has blocked the target user', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.userBlocks.findFirst.mockResolvedValueOnce({
        blockedUid: '1',
        blockerUid: 'searcher-uid',
      });

      const result = await service.findOne('1', select, 'searcher-uid');

      expect(result).toBeNull();
      expect(mockPrismaService.userBlocks.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null when the target user has blocked the searcher', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.userBlocks.findFirst.mockResolvedValueOnce({
        blockedUid: 'searcher-uid',
        blockerUid: '1',
      });

      const result = await service.findOne('1', select, 'searcher-uid');

      expect(result).toBeNull();
      expect(mockPrismaService.userBlocks.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should skip block check when searcherUid is not provided', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      await service.findOne('1', select, undefined);

      expect(mockPrismaService.userBlocks.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstname: 'John',
        uid: '1',
      };

      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findOneByEmail('test@test.com');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
    });

    it('should propagate database errors', async () => {
      mockPrismaService.users.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findOneByEmail('test@test.com')).rejects.toThrow(Error);
    });
  });

  describe('findOneByAppleId', () => {
    it('should return a user if found by apple id', async () => {
      const mockUser = { email: 'test@test.com', uid: '1' };
      mockPrismaService.users.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findOneByAppleId('apple-id');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        select: USERSELECT.findOneByAppleId,
        where: { appleId: 'apple-id' },
      });
    });

    it('should return null when no user matches the apple id', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      const result = await service.findOneByAppleId('unknown-apple-id');

      expect(result).toBeNull();
    });
  });

  describe('findPlayArea', () => {
    it('should return the play area of the user', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        playAreaLatitude: 48.79,
        playAreaLongitude: 2.46,
        playAreaRadiusKm: 20,
      });

      const result = await service.findPlayArea('1');

      expect(result).toEqual({ latitude: 48.79, longitude: 2.46, radiusKm: 20 });
    });

    it('should return null when the user has no play area', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce({
        playAreaLatitude: null,
        playAreaLongitude: null,
        playAreaRadiusKm: null,
      });

      expect(await service.findPlayArea('1')).toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      expect(await service.findPlayArea('unknown')).toBeNull();
    });
  });

  describe('resolveSearchLocation', () => {
    const playArea = {
      playAreaLatitude: 48.79,
      playAreaLongitude: 2.46,
      playAreaRadiusKm: 20,
    };

    it('should keep the position sent by the app', async () => {
      const location = { maxDistance: 5, userLat: 48.84, userLon: 2.24 };

      const result = await service.resolveSearchLocation(location, '1');

      expect(result).toEqual(location);
      expect(mockPrismaService.users.findUnique).not.toHaveBeenCalled();
    });

    it('should use the center and the radius of the play area without position', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(playArea);

      const result = await service.resolveSearchLocation({}, '1');

      expect(result).toEqual({ maxDistance: 20, userLat: 48.79, userLon: 2.46 });
    });

    it('should keep the max distance sent by the app', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(playArea);

      const result = await service.resolveSearchLocation({ maxDistance: 5 }, '1');

      expect(result).toEqual({ maxDistance: 5, userLat: 48.79, userLon: 2.46 });
    });

    it('should return the location unchanged when the user has no play area', async () => {
      mockPrismaService.users.findUnique.mockResolvedValueOnce(null);

      const result = await service.resolveSearchLocation({ maxDistance: 5 }, '1');

      expect(result).toEqual({ maxDistance: 5 });
    });
  });

  describe('findCompatible', () => {
    // Saturday 7 November 2026, 10:00 in Paris
    const filter = {
      fieldUid: 'field-1',
      level: SessionSportLevel.INTERMEDIATE,
      sport: Sport.FOOTBALL,
      startDate: '2026-11-07T09:00:00.000Z',
    };
    const row = {
      distance_m: 3449,
      firstname: 'Léa',
      image_url: null,
      lastname: 'Martin',
      level: 3,
      total_count: BigInt(1),
      uid: 'user-2',
    };

    const getQuery = (): Prisma.Sql => {
      const [strings, ...values] = mockPrismaService.$queryRaw.mock.calls[0];
      return Prisma.sql(strings, ...values);
    };

    beforeEach(() => {
      mockPrismaService.fields.findUnique.mockResolvedValue({ latitude: 48.84, longitude: 2.24 });
      mockPrismaService.$queryRaw.mockResolvedValue([row]);
    });

    it('should throw when the field does not exist', async () => {
      mockPrismaService.fields.findUnique.mockResolvedValueOnce(null);

      await expect(service.findCompatible('user-1', filter)).rejects.toThrow(NotFoundException);
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return no player for a session starting before 6:00', async () => {
      const result = await service.findCompatible('user-1', {
        ...filter,
        startDate: '2026-11-07T02:00:00.000Z',
      });

      expect(result).toEqual({ items: [], nextCursor: null, totalCount: 0 });
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should match the day of week and the period in Paris time', async () => {
      await service.findCompatible('user-1', filter);

      const { values } = getQuery();
      expect(values).toEqual(expect.arrayContaining([TimePeriod.MORNING, 6, '2026-11-07']));
    });

    it('should match the date of one-time preferences only, in Paris time', async () => {
      await service.findCompatible('user-1', filter);

      const { sql, values } = getQuery();
      expect(sql).toContain("(hp.date AT TIME ZONE 'UTC' AT TIME ZONE ?)::date = ?::date");
      expect(values).toEqual(expect.arrayContaining(['ONE_TIME', 'Europe/Paris']));
    });

    it('should accept players one level apart', async () => {
      await service.findCompatible('user-1', filter);

      const { sql, values } = getQuery();
      expect(sql).toContain('ABS(us.level - ?) <= 1');
      expect(values).toContain(SessionSportLevel.INTERMEDIATE);
    });

    it('should order the players by closest level', async () => {
      await service.findCompatible('user-1', filter);

      expect(getQuery().sql).toContain('ABS(level - ?) ASC');
    });

    it('should accept every level for a session open to all levels, without level order', async () => {
      await service.findCompatible('user-1', { ...filter, level: SessionSportLevel.ANY });

      const { sql } = getQuery();
      expect(sql).not.toContain('<= 1');
      expect(sql).not.toContain('ABS(level - ?)');
    });

    it('should keep players without formats when a format is given', async () => {
      await service.findCompatible('user-1', { ...filter, gameMode: GameModes.FIVE_V_FIVE });

      const { sql, values } = getQuery();
      expect(sql).toContain('NOT EXISTS');
      expect(sql).toContain('gm."gameMode"::text = ?');
      expect(values).toContain(GameModes.FIVE_V_FIVE);
    });

    it('should not filter on formats without a format', async () => {
      await service.findCompatible('user-1', filter);

      expect(getQuery().sql).not.toContain('User_game_mode_preferences');
    });

    it('should require the field inside the play area, or no play area', async () => {
      await service.findCompatible('user-1', filter);

      const { sql } = getQuery();
      expect(sql).toContain('u.play_area_latitude IS NULL');
      expect(sql).toContain('distance_m IS NULL OR distance_m <= play_area_radius_km * 1000');
    });

    it('should compute the distance once, after a latitude pre-filter', async () => {
      await service.findCompatible('user-1', filter);

      const { sql } = getQuery();
      expect(sql.match(/ST_DistanceSphere/g)).toHaveLength(1);
      expect(sql).toContain('<= u.play_area_radius_km');
      expect(sql).toContain('distance_m ASC NULLS LAST');
    });

    it('should exclude the current user, blocks, deleted and banned accounts', async () => {
      await service.findCompatible('user-1', filter);

      const { sql, values } = getQuery();
      expect(sql).toContain('u.uid <> ?');
      expect(sql).toContain('User_blocks');
      expect(sql).toContain('u.deleted_at IS NULL');
      expect(sql).toContain('u.is_banned = false');
      expect(values).toContain('user-1');
    });

    describe('with a published session', () => {
      const session = {
        creatorUid: 'user-1',
        fieldUid: 'field-2',
        gameMode: GameModes.FIVE_V_FIVE,
        level: SessionSportLevel.ADVANCED,
        sessionPlayers: [],
        sport: Sport.BASKETBALL,
        startDate: new Date('2026-11-07T17:00:00.000Z'),
      };

      beforeEach(() => {
        mockPrismaService.sessions.findUnique.mockResolvedValue(session);
      });

      it('should exclude its players and its pending or accepted invitations', async () => {
        await service.findCompatible('user-1', { ...filter, sessionUid: 'session-1' });

        const { sql, values } = getQuery();
        expect(sql).toContain('Session_players');
        expect(sql).toContain('si.status::text IN (?, ?)');
        expect(values).toEqual(
          expect.arrayContaining([
            'session-1',
            InvitationStatus.PENDING,
            InvitationStatus.ACCEPTED,
          ]),
        );
        expect(values).not.toContain(InvitationStatus.CANCELED);
      });

      it('should use the characteristics of the session instead of the ones sent', async () => {
        await service.findCompatible('user-1', { ...filter, sessionUid: 'session-1' });

        expect(mockPrismaService.fields.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { uid: 'field-2' } }),
        );
        const { values } = getQuery();
        expect(values).toEqual(
          expect.arrayContaining([
            Sport.BASKETBALL,
            SessionSportLevel.ADVANCED,
            TimePeriod.EVENING,
          ]),
        );
        expect(values).not.toContain(Sport.FOOTBALL);
      });

      it('should accept a player of the session', async () => {
        mockPrismaService.sessions.findUnique.mockResolvedValueOnce({
          ...session,
          creatorUid: 'user-9',
          sessionPlayers: [{ userUid: 'user-1' }],
        });

        await expect(
          service.findCompatible('user-1', { ...filter, sessionUid: 'session-1' }),
        ).resolves.toBeDefined();
      });

      it('should throw when the session does not exist', async () => {
        mockPrismaService.sessions.findUnique.mockResolvedValueOnce(null);

        await expect(
          service.findCompatible('user-1', { ...filter, sessionUid: 'session-1' }),
        ).rejects.toThrow(NotFoundException);
        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
      });

      it('should forbid a user who is neither its creator nor a player', async () => {
        mockPrismaService.sessions.findUnique.mockResolvedValueOnce({
          ...session,
          creatorUid: 'user-9',
        });

        await expect(
          service.findCompatible('user-1', { ...filter, sessionUid: 'session-1' }),
        ).rejects.toThrow(ForbiddenException);
        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
      });
    });

    it('should not look at sessions without a session uid', async () => {
      await service.findCompatible('user-1', filter);

      expect(mockPrismaService.sessions.findUnique).not.toHaveBeenCalled();
      expect(getQuery().sql).not.toContain('Session_invitations');
    });

    it('should return the distance in whole km and never the coordinates', async () => {
      const result = await service.findCompatible('user-1', filter);

      expect(result.items).toEqual([
        {
          distance: 3,
          firstname: 'Léa',
          imageUrl: null,
          lastname: 'Martin',
          level: 3,
          uid: 'user-2',
        },
      ]);
      expect(result.totalCount).toBe(1);
    });

    it('should return at least 1 km for a field next to the play area center', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([{ ...row, distance_m: 120 }]);

      const result = await service.findCompatible('user-1', filter);

      expect(result.items[0].distance).toBe(1);
    });

    it('should return a null distance for a player without play area', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([{ ...row, distance_m: null }]);

      const result = await service.findCompatible('user-1', filter);

      expect(result.items[0].distance).toBeNull();
    });

    it('should paginate with an offset cursor', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([row, { ...row, uid: 'user-3' }]);

      const result = await service.findCompatible('user-1', { ...filter, cursor: '10', limit: 1 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('11');
    });
  });
});

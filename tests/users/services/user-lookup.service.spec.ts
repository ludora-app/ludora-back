import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UserLookupService } from 'src/users/services/user-lookup.service';

describe('UserLookupService', () => {
  let service: UserLookupService;

  const mockPrismaService = {
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
});

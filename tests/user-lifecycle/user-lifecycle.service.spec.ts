import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AppleService } from 'src/apple/apple.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { UserLifecycleService } from 'src/user-lifecycle/user-lifecycle.service';

describe('UserLifecycleService', () => {
  let service: UserLifecycleService;

  const mockPrismaService = {
    $transaction: jest.fn((callback: (tx: typeof mockTx) => Promise<void>) => callback(mockTx)),
    users: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTx = {
    friends: {
      deleteMany: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStorageService = {
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockAppleService = {
    revokeToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserLifecycleService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: StorageService, useValue: mockStorageService },
        { provide: AppleService, useValue: mockAppleService },
      ],
    }).compile();

    service = module.get<UserLifecycleService>(UserLifecycleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('anonymizeUser', () => {
    const uid = 'user-123';

    it('should log warning and return when user is not found', async () => {
      mockTx.users.findUnique.mockResolvedValueOnce(null);

      await service.anonymizeUser(uid);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User ${uid} not marked for deletion (deletedAt is null)`,
      );
      expect(mockTx.users.update).not.toHaveBeenCalled();
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should log warning and return when user deletedAt is null', async () => {
      mockTx.users.findUnique.mockResolvedValueOnce({
        deletedAt: null,
        imageUrl: null,
      });

      await service.anonymizeUser(uid);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `User ${uid} not marked for deletion (deletedAt is null)`,
      );
      expect(mockTx.users.update).not.toHaveBeenCalled();
    });

    it('should anonymize user in DB and not delete storage when user has no custom image', async () => {
      const deletedAt = new Date('2024-01-01');
      mockTx.users.findUnique.mockResolvedValueOnce({
        deletedAt,
        imageUrl: null,
      });
      mockTx.users.update.mockResolvedValueOnce({});
      mockTx.friends.deleteMany.mockResolvedValueOnce({ count: 0 });

      await service.anonymizeUser(uid);

      expect(mockTx.users.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bio: null,
          birthdate: null,
          firstname: 'Utilisateur',
          imageUrl: null,
          isAnonymized: true,
          isConnected: false,
          isEmailVerified: false,
          lastname: 'Supprimé',
          password: null,
          phone: null,
        }),
        where: { uid },
      });
      expect(mockTx.users.update.mock.calls[0][0].data.email).toMatch(
        /^anon_[a-f0-9]{16}@ludora\.app$/,
      );
      expect(mockTx.friends.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ userUid1: uid }, { userUid2: uid }] },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(`User ${uid} DB anonymization successful.`);
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should anonymize user and delete custom avatar from storage when imageUrl is set', async () => {
      const deletedAt = new Date('2024-01-01');
      const imageUrl = 'avatars/user-123/photo.jpg';
      mockTx.users.findUnique.mockResolvedValueOnce({
        deletedAt,
        imageUrl,
      });
      mockTx.users.update.mockResolvedValueOnce({});
      mockTx.friends.deleteMany.mockResolvedValueOnce({ count: 0 });

      await service.anonymizeUser(uid);

      expect(mockTx.users.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(`User ${uid} DB anonymization successful.`);
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(imageUrl);
    });

    it('should not delete storage when imageUrl contains default-avatars', async () => {
      const deletedAt = new Date('2024-01-01');
      mockTx.users.findUnique.mockResolvedValueOnce({
        deletedAt,
        imageUrl: 'https://storage/default-avatars/avatar1.png',
      });
      mockTx.users.update.mockResolvedValueOnce({});
      mockTx.friends.deleteMany.mockResolvedValueOnce({ count: 0 });

      await service.anonymizeUser(uid);

      expect(mockTx.users.update).toHaveBeenCalled();
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should log error and return when transaction throws', async () => {
      const err = new Error('DB error');
      mockPrismaService.$transaction.mockRejectedValueOnce(err);

      await service.anonymizeUser(uid);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error anonymizing user ${uid}: ${err.message}`,
      );
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should log error but not throw when deleteFile fails after successful anonymization', async () => {
      const deletedAt = new Date('2024-01-01');
      const imageUrl = 'avatars/user-123/photo.jpg';
      mockTx.users.findUnique.mockResolvedValueOnce({ deletedAt, imageUrl });
      mockTx.users.update.mockResolvedValueOnce({});
      mockTx.friends.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockStorageService.deleteFile.mockRejectedValueOnce(new Error('Storage error'));

      await service.anonymizeUser(uid);

      expect(mockLogger.info).toHaveBeenCalledWith(`User ${uid} DB anonymization successful.`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete avatar for'),
      );
    });
  });

  describe('anonymizeExpiredUsers', () => {
    it('should not call anonymizeUser when no users to anonymize', async () => {
      mockPrismaService.users.findMany.mockResolvedValueOnce([]);

      const anonymizeSpy = jest.spyOn(service, 'anonymizeUser').mockResolvedValue();

      await service.anonymizeExpiredUsers();

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        select: { uid: true },
        where: {
          deletedAt: { lte: expect.any(Date), not: null },
          isAnonymized: false,
        },
      });
      expect(anonymizeSpy).not.toHaveBeenCalled();

      anonymizeSpy.mockRestore();
    });

    it('should call anonymizeUser for each user returned by findMany', async () => {
      const users = [{ uid: 'uid-1' }, { uid: 'uid-2' }];
      mockPrismaService.users.findMany.mockResolvedValueOnce(users);

      const anonymizeSpy = jest.spyOn(service, 'anonymizeUser').mockResolvedValue();

      await service.anonymizeExpiredUsers();

      expect(anonymizeSpy).toHaveBeenCalledTimes(2);
      expect(anonymizeSpy).toHaveBeenNthCalledWith(1, 'uid-1');
      expect(anonymizeSpy).toHaveBeenNthCalledWith(2, 'uid-2');

      anonymizeSpy.mockRestore();
    });
  });

  describe('purgeAnonymizedUsers', () => {
    it('should not log info when no users are purged', async () => {
      mockPrismaService.users.deleteMany.mockResolvedValueOnce({ count: 0 });

      await service.purgeAnonymizedUsers();

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(mockPrismaService.users.deleteMany).toHaveBeenCalledWith({
        where: {
          deletedAt: { lte: expect.any(Date), not: null },
          isAnonymized: true,
        },
      });
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should log info with count when users are purged', async () => {
      mockPrismaService.users.deleteMany.mockResolvedValueOnce({ count: 5 });

      await service.purgeAnonymizedUsers();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Purged 5 anonymized users successfully (older than 2 years).',
      );
    });

    it('should log error when deleteMany throws', async () => {
      const err = new Error('Delete failed');
      mockPrismaService.users.deleteMany.mockRejectedValueOnce(err);

      await service.purgeAnonymizedUsers();

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error purging anonymized users: ${err.message}`,
      );
    });
  });
});

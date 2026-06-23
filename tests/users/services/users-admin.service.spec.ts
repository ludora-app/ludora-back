import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/services/users.service';
import { UsersAdminService } from 'src/users/services/users-admin.service';

describe('UsersAdminService', () => {
  let service: UsersAdminService;

  const mockPrismaService = {
    users: {
      delete: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userTokens: {
      deleteMany: jest.fn(),
    },
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersAdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersAdminService>(UsersAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllUsersOrderedByReports', () => {
    it('should return paginated reported users', async () => {
      const mockUsers = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          firstname: 'User',
          lastname: 'One',
          createdAt: new Date(),
          imageUrl: 'url',
          sex: 'MALE',
          isEmailVerified: true,
          _count: { reportedByUsers: 2 },
        },
      ];
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);

      const params = { limit: 10, reportReason: 'SPAM' } as any;
      const result = await service.findAllUsersOrderedByReports(params);

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          reportedByUsers: {
            some: { reason: 'SPAM' },
          },
        },
        orderBy: {
          reportedByUsers: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('user1');
      expect(result.items[0].reportCount).toBe(2);
      expect(result.totalCount).toBe(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle pagination cursor', async () => {
      const mockUsers = [
        {
          uid: 'user1',
          email: 'user1@example.com',
          _count: { reportedByUsers: 2 },
        },
        {
          uid: 'user2',
          email: 'user2@example.com',
          _count: { reportedByUsers: 1 },
        },
      ];
      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);

      const params = { limit: 1, cursor: 'cursor-uid' } as any;
      const result = await service.findAllUsersOrderedByReports(params);

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          reportedByUsers: {
            some: {},
          },
        },
        orderBy: {
          reportedByUsers: {
            _count: 'desc',
          },
        },
        take: 1,
        cursor: { uid: 'cursor-uid' },
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].uid).toBe('user1');
      expect(result.nextCursor).toBe('user2');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('banUser', () => {
    const dto = { userUid: 'user-uid', banReason: 'Spamming' };

    it('should successfully ban a user', async () => {
      mockUsersService.findOne.mockResolvedValueOnce({
        uid: 'user-uid',
        email: 'test@example.com',
        isBanned: false,
      });

      await service.banUser(dto as any);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-uid', expect.any(Object));
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { uid: 'user-uid' },
        data: {
          isBanned: true,
          bannedAt: expect.any(Date),
          banReason: 'Spamming',
        },
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[ADMIN ACTION] - User test@example.com (user-uid) has been banned by an admin',
      );
      expect(mockPrismaService.userTokens.deleteMany).toHaveBeenCalledWith({
        where: { uid: 'user-uid' },
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValueOnce(null);

      await expect(service.banUser(dto as any)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
      expect(mockPrismaService.userTokens.deleteMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user is already banned', async () => {
      mockUsersService.findOne.mockResolvedValueOnce({
        uid: 'user-uid',
        email: 'test@example.com',
        isBanned: true,
      });

      await expect(service.banUser(dto as any)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
      expect(mockPrismaService.userTokens.deleteMany).not.toHaveBeenCalled();
    });
  });
});

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

  describe('getUsersOrderedByReports', () => {
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
      const result = await service.getUsersOrderedByReports(params);

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
      const result = await service.getUsersOrderedByReports(params);

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
});

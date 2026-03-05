import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ModerationService } from 'src/moderation/moderation.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    friends: {
      deleteMany: jest.fn(),
    },
    userBlocks: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userReports: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockPinoLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('blockUser', () => {
    const blockerUid = 'blocker-uid-123';
    const userToBlockUid = 'blocked-uid-456';

    it('should block a user and remove friendship when user exists and is not already blocked', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ uid: userToBlockUid });
      mockPrismaService.userBlocks.findUnique.mockResolvedValue(null);
      mockPrismaService.userBlocks.create.mockResolvedValue({} as never);
      mockPrismaService.friends.deleteMany.mockResolvedValue({ count: 0 });

      await service.blockUser(blockerUid, userToBlockUid);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        select: { uid: true },
        where: { uid: userToBlockUid },
      });
      expect(prisma.userBlocks.findUnique).toHaveBeenCalledWith({
        where: {
          blockerUid_blockedUid: {
            blockedUid: userToBlockUid,
            blockerUid,
          },
        },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      const transactionCalls = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(transactionCalls).toHaveLength(2);
      expect(prisma.userBlocks.create).toHaveBeenCalledWith({
        data: {
          blockedUid: userToBlockUid,
          blockerUid,
        },
      });
      expect(prisma.friends.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userUid1: blockerUid, userUid2: userToBlockUid },
            { userUid1: userToBlockUid, userUid2: blockerUid },
          ],
        },
      });
    });

    it('should throw NotFoundException when user to block does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.blockUser(blockerUid, userToBlockUid)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.blockUser(blockerUid, userToBlockUid)).rejects.toThrow('User not found');

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        select: { uid: true },
        where: { uid: userToBlockUid },
      });
      expect(prisma.userBlocks.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already blocked', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ uid: userToBlockUid });
      mockPrismaService.userBlocks.findUnique.mockResolvedValue({
        blockedUid: userToBlockUid,
        blockerUid,
      });

      await expect(service.blockUser(blockerUid, userToBlockUid)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.blockUser(blockerUid, userToBlockUid)).rejects.toThrow(
        'User already blocked',
      );

      expect(prisma.userBlocks.findUnique).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAllBlockedUsers', () => {
    const blockerUid = 'blocker-uid-123';

    it('should return paginated list of blocked users', async () => {
      const rawBlockedUsers = [
        {
          blocked: {
            firstname: 'Jane',
            imageUrl: 'https://example.com/jane.jpg',
            lastname: 'Doe',
            uid: 'blocked-uid-1',
          },
        },
        {
          blocked: {
            firstname: 'John',
            imageUrl: null,
            lastname: 'Smith',
            uid: 'blocked-uid-2',
          },
        },
      ];
      mockPrismaService.userBlocks.findMany.mockResolvedValue(rawBlockedUsers);

      const result = await service.findAllBlockedUsers(blockerUid);

      expect(prisma.userBlocks.findMany).toHaveBeenCalledWith({
        select: {
          blocked: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
              uid: true,
            },
          },
        },
        where: { blockerUid },
      });
      expect(result).toEqual({
        items: [
          {
            firstname: 'Jane',
            imageUrl: 'https://example.com/jane.jpg',
            lastname: 'Doe',
            uid: 'blocked-uid-1',
          },
          {
            firstname: 'John',
            imageUrl: null,
            lastname: 'Smith',
            uid: 'blocked-uid-2',
          },
        ],
        totalCount: 2,
      });
    });

    it('should return empty list when user has no blocked users', async () => {
      mockPrismaService.userBlocks.findMany.mockResolvedValue([]);

      const result = await service.findAllBlockedUsers(blockerUid);

      expect(result).toEqual({
        items: [],
        totalCount: 0,
      });
    });
  });

  describe('createReport', () => {
    const reporterUid = 'reporter-uid-123';
    const createReportDto = {
      description: undefined as string | undefined,
      reason: 'SPAM' as const,
      reportedUid: 'reported-uid-456',
    };

    it('should create a report when reporter has not already reported for this reason', async () => {
      mockPrismaService.userReports.findFirst.mockResolvedValue(null);
      mockPrismaService.userReports.create.mockResolvedValue({} as never);

      await service.createReport(reporterUid, createReportDto);

      expect(prisma.userReports.findFirst).toHaveBeenCalledWith({
        where: {
          reason: createReportDto.reason,
          reporterUid,
        },
      });
      expect(prisma.userReports.create).toHaveBeenCalledWith({
        data: {
          description: createReportDto.description,
          reason: createReportDto.reason,
          reportedUid: createReportDto.reportedUid,
          reporterUid,
        },
      });
    });

    it('should create a report with description when provided', async () => {
      const dtoWithDescription = {
        ...createReportDto,
        description: 'User sent spam links',
      };
      mockPrismaService.userReports.findFirst.mockResolvedValue(null);
      mockPrismaService.userReports.create.mockResolvedValue({} as never);

      await service.createReport(reporterUid, dtoWithDescription);

      expect(prisma.userReports.create).toHaveBeenCalledWith({
        data: {
          description: 'User sent spam links',
          reason: dtoWithDescription.reason,
          reportedUid: dtoWithDescription.reportedUid,
          reporterUid,
        },
      });
    });

    it('should throw ConflictException when reporter already reported for this reason', async () => {
      mockPrismaService.userReports.findFirst.mockResolvedValue({
        id: 'report-1',
        reason: createReportDto.reason,
        reportedUid: createReportDto.reportedUid,
        reporterUid,
      });

      await expect(service.createReport(reporterUid, createReportDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createReport(reporterUid, createReportDto)).rejects.toThrow(
        'You already reported this user for this reason',
      );

      expect(prisma.userReports.findFirst).toHaveBeenCalledWith({
        where: {
          reason: createReportDto.reason,
          reporterUid,
        },
      });
      expect(prisma.userReports.create).not.toHaveBeenCalled();
    });
  });
});

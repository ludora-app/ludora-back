import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { ModerationController } from 'src/moderation/moderation.controller';
import { ModerationService } from 'src/moderation/moderation.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ModerationController', () => {
  let controller: ModerationController;
  let moderationService: ModerationService;

  const mockModerationService = {
    blockUser: jest.fn(),
    createReport: jest.fn(),
    findAllBlockedUsers: jest.fn(),
  };

  const mockPrismaService = {
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    friends: { deleteMany: jest.fn() },
    userBlocks: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    users: { findUnique: jest.fn() },
  };

  const mockPinoLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    })
      .overrideProvider(ModerationService)
      .useValue(mockModerationService)
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ModerationController>(ModerationController);
    moderationService = module.get<ModerationService>(ModerationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('blockUser', () => {
    const mockRequest = {
      user: { uid: 'blocker-uid-123' },
    } as unknown as Request;
    const userToBlockUid = 'blocked-uid-456';

    it('should call service.blockUser with request user uid and param, return void', async () => {
      mockModerationService.blockUser.mockResolvedValue(undefined);

      await controller.blockUser(mockRequest, userToBlockUid);

      expect(moderationService.blockUser).toHaveBeenCalledWith(
        mockRequest['user'].uid,
        userToBlockUid,
      );
      expect(moderationService.blockUser).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user to block does not exist', async () => {
      mockModerationService.blockUser.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.blockUser(mockRequest, userToBlockUid)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.blockUser(mockRequest, userToBlockUid)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ConflictException when user is already blocked', async () => {
      mockModerationService.blockUser.mockRejectedValue(
        new ConflictException('User already blocked'),
      );

      await expect(controller.blockUser(mockRequest, userToBlockUid)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.blockUser(mockRequest, userToBlockUid)).rejects.toThrow(
        'User already blocked',
      );
    });
  });

  describe('createReport', () => {
    const mockRequest = {
      user: { uid: 'reporter-uid-123' },
    } as unknown as Request;
    const createReportDto = {
      description: undefined as string | undefined,
      reason: 'SPAM' as const,
      reportedUid: 'reported-uid-456',
    };

    it('should call service.createReport with reporter uid and body, return void', async () => {
      mockModerationService.createReport.mockResolvedValue(undefined);

      await controller.createReport(mockRequest, createReportDto);

      expect(moderationService.createReport).toHaveBeenCalledWith(
        mockRequest['user'].uid,
        createReportDto,
      );
      expect(moderationService.createReport).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when already reported for this reason', async () => {
      mockModerationService.createReport.mockRejectedValue(
        new ConflictException('You already reported this user for this reason'),
      );

      await expect(controller.createReport(mockRequest, createReportDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.createReport(mockRequest, createReportDto)).rejects.toThrow(
        'You already reported this user for this reason',
      );
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Database error');
      mockModerationService.createReport.mockRejectedValue(error);

      await expect(controller.createReport(mockRequest, createReportDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAllBlockedUsers', () => {
    const mockRequest = {
      user: { uid: 'blocker-uid-123' },
    } as unknown as Request;

    const mockBlockedUsersPaginated = {
      items: [
        {
          firstname: 'Jane',
          imageUrl: 'https://example.com/jane.jpg',
          lastname: 'Doe',
          uid: 'blocked-uid-1',
        },
      ],
      totalCount: 1,
    };

    it('should return blocked users with success message', async () => {
      mockModerationService.findAllBlockedUsers.mockResolvedValue(mockBlockedUsersPaginated);

      const result = await controller.findAllBlockedUsers(mockRequest);

      expect(moderationService.findAllBlockedUsers).toHaveBeenCalledWith(mockRequest['user'].uid);
      expect(result).toEqual({
        data: mockBlockedUsersPaginated,
        message: 'Blocked users fetched successfully',
      });
    });

    it('should pass user uid from request to the service', async () => {
      mockModerationService.findAllBlockedUsers.mockResolvedValue({
        items: [],
        totalCount: 0,
      });

      await controller.findAllBlockedUsers(mockRequest);

      expect(moderationService.findAllBlockedUsers).toHaveBeenCalledWith('blocker-uid-123');
    });

    it('should propagate errors from the service', async () => {
      const error = new Error('Database error');
      mockModerationService.findAllBlockedUsers.mockRejectedValue(error);

      await expect(controller.findAllBlockedUsers(mockRequest)).rejects.toThrow('Database error');
    });
  });
});

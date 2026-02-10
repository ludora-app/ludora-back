import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { FriendsService } from 'src/friends/friends.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { InvitationStatus } from 'generated/prisma/enums';
import { EventTypes } from 'src/notifications/constants/event.types';

describe('FriendsService', () => {
  let service: FriendsService;
  let usersService: any;
  let prismaService: any;
  let eventEmitter: any;
  let logger: any;

  const mockUser = {
    uid: 'user-123',
    firstname: 'John',
    lastname: 'Doe',
    imageUrl: 'profile.jpg',
  };

  const mockOtherUser = {
    uid: 'user-456',
    firstname: 'Jane',
    lastname: 'Smith',
    imageUrl: 'profile2.jpg',
  };

  const mockFriendRequest = {
    userUid1: 'user-123',
    userUid2: 'user-456',
    status: InvitationStatus.PENDING,
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
    updatedAt: new Date('2025-01-01T10:00:00.000Z'),
    user1: {
      firstname: 'John',
      lastname: 'Doe',
      imageUrl: 'profile.jpg',
    },
    user2: {
      firstname: 'Jane',
      lastname: 'Smith',
      imageUrl: 'profile2.jpg',
    },
  };

  beforeEach(async () => {
    const mockUsersService = {
      findOne: jest.fn(),
    };

    const mockPrismaService = {
      friends: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $executeRawUnsafe: jest.fn(),
      $queryRaw: jest.fn(),
    } as any;

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
    usersService = module.get(UsersService) as any;
    prismaService = module.get(PrismaService) as any;
    eventEmitter = module.get(EventEmitter2) as any;
    logger = module.get(PinoLogger) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a friend request successfully', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser as any);
      usersService.findOne.mockResolvedValueOnce(mockOtherUser as any);
      prismaService.friends.findFirst.mockResolvedValue(null);
      prismaService.friends.create.mockResolvedValue(mockFriendRequest as any);

      const result = await service.create('user-123', 'user-456');

      expect(result).toBeUndefined();
      expect(usersService.findOne).toHaveBeenCalledTimes(2);
      expect(prismaService.friends.findFirst).toHaveBeenCalled();
      expect(prismaService.friends.create).toHaveBeenCalledWith({
        data: {
          status: InvitationStatus.PENDING,
          userUid1: 'user-123',
          userUid2: 'user-456',
        },
        include: {
          user1: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
            },
          },
          user2: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
            },
          },
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventTypes.FRIEND_REQUEST, {
        recipientId: 'user-456',
        senderId: 'user-123',
        senderName: 'Jane Smith',
      });
    });

    it('should throw BadRequestException when user tries to add themselves', async () => {
      await expect(service.create('user-123', 'user-123')).rejects.toThrow(
        new BadRequestException('You cannot add yourself as a friend'),
      );
      expect(logger.error).toHaveBeenCalledWith('User user-123 cannot add himself as a friend');
    });

    it('should throw BadRequestException when sender does not exist', async () => {
      usersService.findOne.mockResolvedValueOnce(null);

      await expect(service.create('user-123', 'user-456')).rejects.toThrow(
        new BadRequestException('Sender not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('Sender user-123 not found');
    });

    it('should throw BadRequestException when receiver does not exist', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser as any);
      usersService.findOne.mockResolvedValueOnce(null);

      await expect(service.create('user-123', 'user-456')).rejects.toThrow(
        new BadRequestException('Receiver not found'),
      );
      expect(logger.error).toHaveBeenCalledWith('Receiver user-456 not found');
    });

    it('should throw ConflictException when friend request already exists', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser as any);
      usersService.findOne.mockResolvedValueOnce(mockOtherUser as any);
      prismaService.friends.findFirst.mockResolvedValue(mockFriendRequest as any);

      await expect(service.create('user-123', 'user-456')).rejects.toThrow(
        new ConflictException('Friend request already exists'),
      );
    });
  });

  describe('findAll', () => {
    const mockFilters = {
      cursor: undefined,
      limit: 10,
      name: undefined,
    };

    it('should return paginated friends list', async () => {
      const mockFriends = [
        {
          friendUid: 'user-456',
          createdAt: mockFriendRequest.createdAt,
          firstname: 'Jane',
          lastname: 'Smith',
          avatarUrl: 'profile2.jpg',
          isInvited: false,
        },
      ];
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockFriends as any);

      const result = await service.findAllMyFriends(mockFilters, 'user-123');

      expect(result).toEqual({
        items: [
          {
            friendUid: 'user-456',
            createdAt: mockFriendRequest.createdAt,
            firstname: 'Jane',
            lastname: 'Smith',
            avatarUrl: 'profile2.jpg',
            isInvited: false,
          },
        ],
        nextCursor: null,
        totalCount: 1,
      });
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should filter friends by name', async () => {
      const filtersWithName = { ...mockFilters, name: 'Jane' };
      const mockFriends = [
        {
          friendUid: 'user-456',
          createdAt: mockFriendRequest.createdAt,
          firstname: 'Jane',
          lastname: 'Smith',
          avatarUrl: 'profile2.jpg',
          isInvited: false,
        },
      ];
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockFriends as any);

      await service.findAllMyFriends(filtersWithName, 'user-123');

      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should handle pagination with cursor', async () => {
      const filtersWithCursor = { ...mockFilters, cursor: 'user-123' };
      const mockFriends = [
        {
          friendUid: 'user-456',
          createdAt: mockFriendRequest.createdAt,
          firstname: 'Jane',
          lastname: 'Smith',
          avatarUrl: 'profile2.jpg',
          isInvited: false,
        },
      ];
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockFriends as any);

      await service.findAllMyFriends(filtersWithCursor, 'user-123');

      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return nextCursor when more results available', async () => {
      const mockFriends = Array(11).fill({
        friendUid: 'user-123',
        createdAt: mockFriendRequest.createdAt,
        firstname: 'Jane',
        lastname: 'Smith',
        avatarUrl: 'profile2.jpg',
        isInvited: false,
      });
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockFriends as any);

      const result = await service.findAllMyFriends(mockFilters, 'user-123');

      expect(result.nextCursor).toBe('user-123');
      expect(result.totalCount).toBe(10);
    });
  });

  describe('findAllMyRequests', () => {
    const mockFilters = {
      cursor: undefined,
      limit: 10,
      name: undefined,
    };

    const mockPendingRequest = {
      senderUid: 'user-789',
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      firstname: 'Alice',
      lastname: 'Johnson',
      avatarUrl: 'profile3.jpg',
    };

    it('should return paginated friend requests list', async () => {
      const mockRequests = [mockPendingRequest];
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockRequests as any);

      const result = await service.findAllMyRequests(mockFilters, 'user-123');

      expect(result).toEqual({
        items: [
          {
            senderUid: 'user-789',
            createdAt: mockPendingRequest.createdAt,
            firstname: 'Alice',
            lastname: 'Johnson',
            avatarUrl: 'profile3.jpg',
          },
        ],
        nextCursor: null,
        totalCount: 1,
      });
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should filter friend requests by name', async () => {
      const filtersWithName = { ...mockFilters, name: 'Alice' };
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue([mockPendingRequest] as any);

      await service.findAllMyRequests(filtersWithName, 'user-123');

      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should handle pagination with cursor', async () => {
      const filtersWithCursor = { ...mockFilters, cursor: 'user-789' };
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue([mockPendingRequest] as any);

      await service.findAllMyRequests(filtersWithCursor, 'user-123');

      expect(prismaService.$executeRawUnsafe).toHaveBeenCalled();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return nextCursor when more results available', async () => {
      const mockRequests = Array(11).fill(mockPendingRequest);
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockRequests as any);

      const result = await service.findAllMyRequests(mockFilters, 'user-123');

      expect(result.nextCursor).toBe('user-789');
      expect(result.totalCount).toBe(10);
    });

    it('should return requests where user is receiver (userUid2)', async () => {
      const mockRequests = [mockPendingRequest];
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue(mockRequests as any);

      const result = await service.findAllMyRequests(mockFilters, 'user-123');

      expect(result.items[0].senderUid).toBe('user-789');
      expect(result.items[0].firstname).toBe('Alice');
      expect(result.items[0].lastname).toBe('Johnson');
    });

    it('should return request without image URL if no profile picture', async () => {
      const requestWithoutImage = {
        ...mockPendingRequest,
        avatarUrl: null,
      };
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue([requestWithoutImage] as any);

      const result = await service.findAllMyRequests(mockFilters, 'user-123');

      expect(result.items[0].avatarUrl).toBeNull();
    });

    it('should return empty list when no requests found', async () => {
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);
      prismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.findAllMyRequests(mockFilters, 'user-123');

      expect(result).toEqual({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should find a friend request successfully', async () => {
      prismaService.friends.findFirst.mockResolvedValue(mockFriendRequest as any);

      const result = await service.findOne('user-123', 'user-456');

      expect(result).toEqual({
        createdAt: mockFriendRequest.createdAt,
        updatedAt: mockFriendRequest.updatedAt,
        status: InvitationStatus.PENDING,
        friendUid: 'user-456',
        firstname: 'Jane',
        lastname: 'Smith',
        avatarUrl: 'profile2.jpg',
      });
      expect(prismaService.friends.findFirst).toHaveBeenCalled();
    });

    it('should return friend without image URL if no profile picture', async () => {
      const friendWithoutImage = {
        ...mockFriendRequest,
        user2: { ...mockFriendRequest.user2, imageUrl: null },
      };
      prismaService.friends.findFirst.mockResolvedValue(friendWithoutImage as any);

      const result = await service.findOne('user-123', 'user-456');

      expect(result.avatarUrl).toBeNull();
    });

    it('should throw NotFoundException when friend request not found', async () => {
      prismaService.friends.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-123', 'user-456')).rejects.toThrow(
        new NotFoundException('Friend request between user-123 and user-456 not found'),
      );
    });
  });

  describe('update', () => {
    it('should accept a friend request successfully', async () => {
      usersService.findOne.mockResolvedValue(mockOtherUser as any);
      prismaService.friends.findFirst.mockResolvedValue(mockFriendRequest as any);
      const updatedFriend = { ...mockFriendRequest, status: InvitationStatus.ACCEPTED };
      prismaService.friends.update.mockResolvedValue(updatedFriend as any);

      await service.update('user-456', 'user-123', InvitationStatus.ACCEPTED);

      expect(prismaService.friends.update).toHaveBeenCalledWith({
        data: { status: InvitationStatus.ACCEPTED },
        include: expect.any(Object),
        where: {
          userUid1_userUid2: {
            userUid1: 'user-123',
            userUid2: 'user-456',
          },
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(EventTypes.FRIEND_ACCEPTED, {
        recipientUid: 'user-123',
        senderName: 'Jane Smith',
        senderUid: 'user-456',
      });
    });

    it('should cancel a friend request and delete it', async () => {
      usersService.findOne.mockResolvedValue(mockOtherUser as any);
      prismaService.friends.findFirst.mockResolvedValue(mockFriendRequest as any);
      const canceledFriend = { ...mockFriendRequest, status: InvitationStatus.CANCELED };
      prismaService.friends.update.mockResolvedValue(canceledFriend as any);
      prismaService.friends.delete.mockResolvedValue(null as any);

      await service.update('user-123', 'user-456', InvitationStatus.CANCELED);

      expect(prismaService.friends.delete).toHaveBeenCalledWith({
        where: {
          userUid1_userUid2: {
            userUid1: 'user-123',
            userUid2: 'user-456',
          },
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Friend request between user-123 and user-456 canceled',
      );
    });

    it('should throw NotFoundException when receiver does not exist', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'user-456', InvitationStatus.ACCEPTED),
      ).rejects.toThrow(new NotFoundException('Receiver user-456 not found'));
    });

    it('should throw NotFoundException when friend request not found', async () => {
      usersService.findOne.mockResolvedValue(mockOtherUser as any);
      prismaService.friends.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-123', 'user-456', InvitationStatus.ACCEPTED),
      ).rejects.toThrow(
        new NotFoundException('Friend request between user-123 and user-456 not found'),
      );
    });
  });

  describe('checkUpdateAuthorization', () => {
    it('should throw BadRequestException when status is PENDING', () => {
      expect(() => service.checkUpdateAuthorization(true, false, InvitationStatus.PENDING)).toThrow(
        new BadRequestException('The invitation is already pending'),
      );
    });

    it('should throw BadRequestException when both users have same sender status', () => {
      expect(() => service.checkUpdateAuthorization(true, true, InvitationStatus.ACCEPTED)).toThrow(
        new BadRequestException('You are not authorized to update this invitation'),
      );
      expect(() =>
        service.checkUpdateAuthorization(false, false, InvitationStatus.ACCEPTED),
      ).toThrow(new BadRequestException('You are not authorized to update this invitation'));
    });

    it('should throw BadRequestException when sender tries to accept/reject', () => {
      expect(() =>
        service.checkUpdateAuthorization(true, false, InvitationStatus.ACCEPTED),
      ).toThrow(
        new BadRequestException(
          `The invitation sender cannot update the status to ${InvitationStatus.ACCEPTED}`,
        ),
      );
    });

    it('should throw BadRequestException when receiver tries to cancel', () => {
      expect(() =>
        service.checkUpdateAuthorization(false, true, InvitationStatus.CANCELED),
      ).toThrow(new BadRequestException('The invitation receiver cannot cancel the invitation'));
    });

    it('should not throw when sender cancels', () => {
      expect(() =>
        service.checkUpdateAuthorization(true, false, InvitationStatus.CANCELED),
      ).not.toThrow();
    });

    it('should not throw when receiver accepts', () => {
      expect(() =>
        service.checkUpdateAuthorization(false, true, InvitationStatus.ACCEPTED),
      ).not.toThrow();
    });
  });

  describe('emitFriendRequestUpdateEvent', () => {
    it('should emit FRIEND_ACCEPTED event when status is ACCEPTED', () => {
      const acceptedFriend = { ...mockFriendRequest, status: InvitationStatus.ACCEPTED };

      service.emitFriendRequestUpdateEvent('user-123', 'user-456', acceptedFriend as any);

      expect(eventEmitter.emit).toHaveBeenCalledWith(EventTypes.FRIEND_ACCEPTED, {
        recipientUid: 'user-123',
        senderName: 'Jane Smith',
        senderUid: 'user-456',
      });
    });

    it('should not emit event when status is not ACCEPTED', () => {
      service.emitFriendRequestUpdateEvent('user-123', 'user-456', mockFriendRequest as any);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a friend successfully', async () => {
      const acceptedFriend = { ...mockFriendRequest, status: InvitationStatus.ACCEPTED };
      prismaService.friends.findFirst.mockResolvedValue(acceptedFriend as any);
      prismaService.friends.delete.mockResolvedValue(null as any);

      await service.remove('user-123', 'user-456');

      expect(prismaService.friends.delete).toHaveBeenCalledWith({
        where: {
          userUid1_userUid2: {
            userUid1: 'user-123',
            userUid2: 'user-456',
          },
        },
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Friend request between user-123 and user-456 removed',
      );
    });

    it('should throw NotFoundException when friend not found', async () => {
      prismaService.friends.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-123', 'user-456')).rejects.toThrow(
        new NotFoundException('Friend request between user-123 and user-456 not found'),
      );
    });
  });
});

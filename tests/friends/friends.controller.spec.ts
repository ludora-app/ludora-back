import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { FriendsController } from 'src/friends/friends.controller';
import { FriendsService } from 'src/friends/friends.service';
import { InvitationStatus } from 'generated/prisma/enums';
import { CreateFriendDto } from 'src/friends/dto/input/create-friend.dto';
import { UpdateFriendDto } from 'src/friends/dto/input/update-friend.dto';
import { UserFilterDto } from 'src/users/dto';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';

describe('FriendsController', () => {
  let controller: FriendsController;
  let friendsService: any;

  const mockRequest = {
    user: {
      uid: 'user-123',
    },
  } as any;

  const mockFriendRequest = {
    userUid1: 'user-123',
    userUid2: 'user-456',
    status: InvitationStatus.PENDING,
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
    updatedAt: new Date('2025-01-01T10:00:00.000Z'),
  };

  const mockFriendResponseDto = {
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
    updatedAt: new Date('2025-01-01T10:00:00.000Z'),
    status: InvitationStatus.PENDING,
    friendUid: 'user-456',
    userName: 'Jane Smith',
    userProfilePicture: 'https://example.com/profile.jpg',
  };

  const mockPaginatedResponse = {
    items: [mockFriendResponseDto],
    nextCursor: null,
    totalCount: 1,
  };

  beforeEach(async () => {
    const mockFriendsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockAuthGuard = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { uid: 'user-123' };
        return true;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [{ provide: FriendsService, useValue: mockFriendsService }],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<FriendsController>(FriendsController);
    friendsService = module.get(FriendsService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a friend request successfully', async () => {
      const createFriendDto: CreateFriendDto = {
        receiverUid: 'user-456',
      };
      friendsService.create.mockResolvedValue(mockFriendRequest as any);

      const result = await controller.create(createFriendDto, mockRequest);

      expect(result).toEqual({
        data: mockFriendRequest,
        message: 'Friend request created successfully',
      });
      expect(friendsService.create).toHaveBeenCalledWith('user-123', 'user-456');
    });

    it('should pass the correct sender UID from request', async () => {
      const createFriendDto: CreateFriendDto = {
        receiverUid: 'user-789',
      };
      friendsService.create.mockResolvedValue(mockFriendRequest as any);

      await controller.create(createFriendDto, mockRequest);

      expect(friendsService.create).toHaveBeenCalledWith('user-123', 'user-789');
    });
  });

  describe('findAll', () => {
    it('should return paginated friends list', async () => {
      const filters: UserFilterDto = {
        cursor: undefined,
        limit: 10,
        name: undefined,
      };
      friendsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(filters, mockRequest);

      expect(result).toEqual({
        data: mockPaginatedResponse,
        message: 'Friends fetched successfully',
      });
      expect(friendsService.findAll).toHaveBeenCalledWith(filters, 'user-123');
    });

    it('should pass filters correctly to the service', async () => {
      const filters: UserFilterDto = {
        cursor: 'cursor-123',
        limit: 20,
        name: 'Jane',
      };
      friendsService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(filters, mockRequest);

      expect(friendsService.findAll).toHaveBeenCalledWith(filters, 'user-123');
    });

    it('should handle empty results', async () => {
      const filters: UserFilterDto = {
        cursor: undefined,
        limit: 10,
        name: undefined,
      };
      const emptyResponse = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };
      friendsService.findAll.mockResolvedValue(emptyResponse);

      const result = await controller.findAll(filters, mockRequest);

      expect(result).toEqual({
        data: emptyResponse,
        message: 'Friends fetched successfully',
      });
    });
  });

  describe('findMyFriendRequest', () => {
    it('should return a friend request successfully', async () => {
      friendsService.findOne.mockResolvedValue(mockFriendResponseDto);

      const result = await controller.findMyFriendRequest('user-456', mockRequest);

      expect(result).toEqual({
        data: mockFriendResponseDto,
        message: 'Friend request fetched successfully',
      });
      expect(friendsService.findOne).toHaveBeenCalledWith('user-123', 'user-456');
    });

    it('should pass correct user UIDs to the service', async () => {
      friendsService.findOne.mockResolvedValue(mockFriendResponseDto);

      await controller.findMyFriendRequest('user-789', mockRequest);

      expect(friendsService.findOne).toHaveBeenCalledWith('user-123', 'user-789');
    });
  });

  describe('update', () => {
    it('should update friend request status to ACCEPTED', async () => {
      const updateFriendDto: UpdateFriendDto = {
        status: InvitationStatus.ACCEPTED,
      };
      friendsService.update.mockResolvedValue(undefined);

      const result = await controller.update('user-456', updateFriendDto, mockRequest);

      expect(result).toBeUndefined();
      expect(friendsService.update).toHaveBeenCalledWith(
        'user-123',
        'user-456',
        InvitationStatus.ACCEPTED,
      );
    });

    it('should update friend request status to REJECTED', async () => {
      const updateFriendDto: UpdateFriendDto = {
        status: InvitationStatus.REJECTED,
      };
      friendsService.update.mockResolvedValue(undefined);

      await controller.update('user-456', updateFriendDto, mockRequest);

      expect(friendsService.update).toHaveBeenCalledWith(
        'user-123',
        'user-456',
        InvitationStatus.REJECTED,
      );
    });

    it('should update friend request status to CANCELED', async () => {
      const updateFriendDto: UpdateFriendDto = {
        status: InvitationStatus.CANCELED,
      };
      friendsService.update.mockResolvedValue(undefined);

      await controller.update('user-456', updateFriendDto, mockRequest);

      expect(friendsService.update).toHaveBeenCalledWith(
        'user-123',
        'user-456',
        InvitationStatus.CANCELED,
      );
    });

    it('should pass correct user UIDs and status to the service', async () => {
      const updateFriendDto: UpdateFriendDto = {
        status: InvitationStatus.ACCEPTED,
      };
      friendsService.update.mockResolvedValue(undefined);

      await controller.update('user-789', updateFriendDto, mockRequest);

      expect(friendsService.update).toHaveBeenCalledWith(
        'user-123',
        'user-789',
        InvitationStatus.ACCEPTED,
      );
    });
  });

  describe('remove', () => {
    it('should remove a friend successfully', async () => {
      friendsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('user-456', mockRequest);

      expect(result).toBeUndefined();
      expect(friendsService.remove).toHaveBeenCalledWith('user-123', 'user-456');
    });

    it('should pass correct user UIDs to the service', async () => {
      friendsService.remove.mockResolvedValue(undefined);

      await controller.remove('user-789', mockRequest);

      expect(friendsService.remove).toHaveBeenCalledWith('user-123', 'user-789');
    });
  });

  describe('integration with request object', () => {
    it('should extract user UID correctly from different request formats', async () => {
      const customRequest = {
        user: {
          uid: 'custom-user-123',
        },
      } as any;

      const createFriendDto: CreateFriendDto = {
        receiverUid: 'user-456',
      };
      friendsService.create.mockResolvedValue(mockFriendRequest as any);

      await controller.create(createFriendDto, customRequest);

      expect(friendsService.create).toHaveBeenCalledWith('custom-user-123', 'user-456');
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { USERSELECT } from 'src/shared/constants/select-user';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { UsersController } from 'src/users/controllers/users.controller';
import { UpdatePasswordDto, UpdateUserDto, UserFilterDto } from 'src/users/dto';
import { PasswordResetRequestDto } from 'src/users/dto/input/password-reset-request.dto';
import { UpdateUserEmailDto } from 'src/users/dto/input/update-user.dto';
import { UserLookupService } from 'src/users/services/user-lookup.service';
import { UsersService } from 'src/users/services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let lookupService: UserLookupService;

  const mockUserLookupService = {
    findOne: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockUsersService = {
    cancelDeletionRequest: jest.fn(),
    deactivate: jest.fn(),
    deletePlayArea: jest.fn(),
    deletionRequest: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
    sendCodeForPasswordResetRequest: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn(),
    updatePlayArea: jest.fn(),
  };

  const mockUser = {
    _count: {
      friendsReceived: 0,
      friendsSent: 0,
      sessionPlayers: 0,
    },
    bio: 'test bio',
    firstname: 'John',
    imageUrl: 'test-url',
    lastname: 'Doe',
    name: 'Test User',
    uid: '1',
    userSportPreferences: [],
  };

  const mockUserFindMe = {
    _count: {
      friendsReceived: 0,
      friendsSent: 0,
      sessionPlayers: 0,
    },
    bio: 'test bio',
    birthdate: new Date('1990-01-01'),
    email: 'test@test.com',
    firstname: 'John',
    imageUrl: 'test-url',
    isConnected: true,
    isEmailVerified: true,
    lastname: 'Doe',
    phone: '+33612345678',
    type: 'PLAYER',
    uid: '1',
    userHourPreferences: [],
    userSportPreferences: [],
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserLookupService,
          useValue: mockUserLookupService,
        },
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(DevOnlyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    lookupService = module.get<UserLookupService>(UserLookupService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const filters: UserFilterDto = { limit: 10 };
      const userUid = 'current-user-uid';
      const mockRequest = { user: { uid: userUid } };
      mockUsersService.findAll.mockResolvedValue({
        items: [mockUser],
        nextCursor: null,
        totalCount: 1,
      });

      const result = await controller.findAll(mockRequest.user.uid, filters);

      expect(result).toEqual({
        data: { items: [mockUser], nextCursor: null, totalCount: 1 },
        message: 'Users fetched successfully',
      });
      expect(service.findAll).toHaveBeenCalledWith(filters, userUid);
    });
  });

  describe('findOne', () => {
    it('should return a single user by uid with searcherUid from request', async () => {
      const mockRequest = { user: { uid: 'searcher-uid' } };
      mockUserLookupService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1', mockRequest.user.uid);

      expect(result).toEqual({
        data: {
          bio: 'test bio',
          firstname: 'John',
          friendsCount: 0,
          imageUrl: 'test-url',
          lastname: 'Doe',
          matchesCount: 0,
          name: 'John Doe',
          sportPreferences: [],
          uid: '1',
        },
        message: 'User fetched successfully',
      });
      expect(lookupService.findOne).toHaveBeenCalledWith('1', USERSELECT.findOne, 'searcher-uid');
    });

    it('should throw NotFoundException when user is not found', async () => {
      const mockRequest = { user: { uid: 'searcher-uid' } };
      mockUserLookupService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('unknown-uid', mockRequest.user.uid)).rejects.toThrow(
        NotFoundException,
      );
      expect(lookupService.findOne).toHaveBeenCalledWith(
        'unknown-uid',
        USERSELECT.findOne,
        'searcher-uid',
      );
    });

    it('should throw NotFoundException when a block exists between searcher and target', async () => {
      const mockRequest = { user: { uid: 'searcher-uid' } };
      mockUserLookupService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('blocked-uid', mockRequest.user.uid)).rejects.toThrow(
        NotFoundException,
      );
      expect(lookupService.findOne).toHaveBeenCalledWith(
        'blocked-uid',
        USERSELECT.findOne,
        'searcher-uid',
      );
    });

    it('should return user with undefined searcherUid when called without auth token (public access)', async () => {
      // request.user exists but has no uid (e.g. optional auth guard leaves user empty)
      const mockRequest: { user: { uid?: string } } = { user: {} };
      mockUserLookupService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1', mockRequest.user.uid);

      expect(result).toBeDefined();
      expect(lookupService.findOne).toHaveBeenCalledWith('1', USERSELECT.findOne, undefined);
    });

    it('should never return the play area of another user', async () => {
      mockUserLookupService.findOne.mockResolvedValue({
        ...mockUser,
        playAreaLatitude: 48.79,
        playAreaLongitude: 2.46,
        playAreaRadiusKm: 10,
      });

      const result = await controller.findOne('1', 'searcher-uid');

      expect(JSON.stringify(result.data)).not.toMatch(/playArea|48\.79|2\.46/);
      expect(Object.keys(USERSELECT.findOne)).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^playArea/)]),
      );
    });
  });

  describe('findMe', () => {
    it('should return the authenticated user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockUserLookupService.findOne.mockResolvedValue(mockUserFindMe);

      const result = await controller.findMe(mockRequest.user.uid);

      expect(result.data).toBeDefined();
      expect(result.data.uid).toBe('1');
      expect(result.data.email).toBe('test@test.com');
      expect(result.data.profileStatus).toBe('INCOMPLETE');
      expect(result.message).toBe('User fetched successfully');
      expect(lookupService.findOne).toHaveBeenCalledWith('1', USERSELECT.findMe);
    });

    it('should return the play area of the authenticated user', async () => {
      mockUserLookupService.findOne.mockResolvedValue({
        ...mockUserFindMe,
        playAreaLatitude: 48.86,
        playAreaLongitude: 2.38,
        playAreaRadiusKm: 10,
      });

      const result = await controller.findMe('1');

      expect(result.data.playArea).toEqual({
        latitude: 48.86,
        longitude: 2.38,
        radiusKm: 10,
      });
    });

    it('should return a null play area when the user has not set one', async () => {
      mockUserLookupService.findOne.mockResolvedValue(mockUserFindMe);

      const result = await controller.findMe({ user: { uid: '1' } } as any);

      expect(result.data.playArea).toBeNull();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      mockUserLookupService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await controller.findOneByEmail('test@test.com');

      expect(result).toEqual({
        data: mockUser,
        message: 'User fetched successfully',
      });
      expect(lookupService.findOneByEmail).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('update', () => {
    it('should update a user without image', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updateDto: UpdateUserDto = {
        firstname: 'Updated Name',
      };
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await controller.update(mockRequest.user.uid, updateDto);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith('1', updateDto, undefined);
    });

    it('should update a user with image', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updateDto: UpdateUserDto = {
        firstname: 'Updated Name',
      };
      const mockFiles = [{ buffer: Buffer.from('image1'), originalname: 'profile.jpg' }];
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await controller.update(mockRequest.user.uid, updateDto, mockFiles);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith('1', updateDto, {
        file: mockFiles[0].buffer,
        name: mockFiles[0].originalname,
      });
    });
  });

  describe('updatePlayArea', () => {
    it('should update the play area of the connected user', async () => {
      const updatePlayAreaDto = {
        latitude: 48.8612,
        longitude: 2.3789,
        radiusKm: 10,
      };
      mockUsersService.updatePlayArea.mockResolvedValue(undefined);

      await controller.updatePlayArea('1', updatePlayAreaDto);

      expect(service.updatePlayArea).toHaveBeenCalledWith('1', updatePlayAreaDto);
    });
  });

  describe('deletePlayArea', () => {
    it('should delete the play area of the connected user', async () => {
      mockUsersService.deletePlayArea.mockResolvedValue(undefined);

      await controller.deletePlayArea('1');

      expect(service.deletePlayArea).toHaveBeenCalledWith('1');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updatePasswordDto: UpdatePasswordDto = {
        newPassword: 'newPass',
        oldPassword: 'oldPass',
      };
      mockUsersService.updatePassword.mockResolvedValue({
        message: 'User password updated successfully',
      });

      const result = await controller.updatePassword(mockRequest.user.uid, updatePasswordDto);

      expect(result).toEqual({
        message: 'User password updated successfully',
      });
      expect(service.updatePassword).toHaveBeenCalledWith('1', updatePasswordDto);
    });
  });

  describe('updateEmail', () => {
    it('should update user email', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updateEmailDto: UpdateUserEmailDto = {
        email: 'newemail@test.com',
      };
      mockUsersService.updateEmail.mockResolvedValue(undefined);

      const result = await controller.updateEmail(mockRequest.user.uid, updateEmailDto);

      expect(result).toBeUndefined();
      expect(service.updateEmail).toHaveBeenCalledWith('1', 'newemail@test.com');
    });

    it('should handle errors from service', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updateEmailDto: UpdateUserEmailDto = {
        email: 'newemail@test.com',
      };
      mockUsersService.updateEmail.mockRejectedValue(new Error('Email update failed'));

      await expect(controller.updateEmail(mockRequest.user.uid, updateEmailDto)).rejects.toThrow(
        'Email update failed',
      );
      expect(service.updateEmail).toHaveBeenCalledWith('1', 'newemail@test.com');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      mockUsersService.deactivate.mockResolvedValue({
        message: 'User 1 has been deactivated',
      });

      const result = await controller.deactivate(mockRequest.user.uid);

      expect(result).toEqual({
        message: 'User 1 has been deactivated',
      });
      expect(service.deactivate).toHaveBeenCalledWith('1');
    });
  });

  describe('deletionRequest', () => {
    it('should request user deletion successfully', async () => {
      const mockRequest = { user: { uid: 'user-123' } };
      mockUsersService.deletionRequest.mockResolvedValue(undefined);

      const result = await controller.deletionRequest(mockRequest.user.uid);

      expect(result).toBeUndefined();
      expect(service.deletionRequest).toHaveBeenCalledWith('user-123');
    });

    it('should propagate BadRequestException when user already has a deletion request', async () => {
      const mockRequest = { user: { uid: 'user-123' } };
      mockUsersService.deletionRequest.mockRejectedValue(
        new Error('User already has a deletion request'),
      );

      await expect(controller.deletionRequest(mockRequest.user.uid)).rejects.toThrow(
        'User already has a deletion request',
      );
      expect(service.deletionRequest).toHaveBeenCalledWith('user-123');
    });
  });

  describe('cancelDeletionRequest', () => {
    it('should cancel deletion request successfully', async () => {
      const mockRequest = { user: { uid: 'user-123' } };
      mockUsersService.cancelDeletionRequest.mockResolvedValue(undefined);

      const result = await controller.cancelDeletionRequest(mockRequest.user.uid);

      expect(result).toBeUndefined();
      expect(service.cancelDeletionRequest).toHaveBeenCalledWith('user-123');
    });

    it('should propagate BadRequestException when user has no deletion request', async () => {
      const mockRequest = { user: { uid: 'user-123' } };
      mockUsersService.cancelDeletionRequest.mockRejectedValue(
        new Error('User does not have a deletion request'),
      );

      await expect(controller.cancelDeletionRequest(mockRequest.user.uid)).rejects.toThrow(
        'User does not have a deletion request',
      );
      expect(service.cancelDeletionRequest).toHaveBeenCalledWith('user-123');
    });
  });

  describe('passwordResetRequest', () => {
    it('should request password reset successfully', async () => {
      const dto: PasswordResetRequestDto = {
        email: 'test@test.com',
      };
      mockUsersService.sendCodeForPasswordResetRequest.mockResolvedValue(undefined);

      const result = await controller.passwordResetRequest(dto);

      expect(result).toBeUndefined();
      expect(service.sendCodeForPasswordResetRequest).toHaveBeenCalledWith('test@test.com');
    });

    it('should handle errors from service', async () => {
      const dto: PasswordResetRequestDto = {
        email: 'test@test.com',
      };
      mockUsersService.sendCodeForPasswordResetRequest.mockRejectedValue(
        new Error('Password reset request failed'),
      );

      await expect(controller.passwordResetRequest(dto)).rejects.toThrow(
        'Password reset request failed',
      );
      expect(service.sendCodeForPasswordResetRequest).toHaveBeenCalledWith('test@test.com');
    });
  });
});

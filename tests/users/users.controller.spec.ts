import { Test, TestingModule } from '@nestjs/testing';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UpdatePasswordDto, UpdateUserDto, UserFilterDto } from 'src/users/dto';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { PasswordResetRequestDto } from 'src/users/dto/input/password-reset-request.dto';
import { UpdateUserEmailDto } from 'src/users/dto/input/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    deactivate: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findOneByEmail: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    updateEmail: jest.fn(),
    sendCodeForPasswordResetRequest: jest.fn(),
  };

  const mockUser = {
    bio: 'test bio',
    firstname: 'John',
    uid: '1',
    imageUrl: 'test-url',
    lastname: 'Doe',
    name: 'Test User',
  };

  const mockUserFindMe = {
    bio: 'test bio',
    birthdate: new Date('1990-01-01'),
    email: 'test@test.com',
    firstname: 'John',
    imageUrl: 'test-url',
    isConnected: true,
    isEmailVerified: true,
    lastname: 'Doe',
    phone: '+33612345678',
    stripeAccountId: 'stripe_123',
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
      ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const filters: UserFilterDto = { limit: 10 };
      mockUsersService.findAll.mockResolvedValue({
        items: [mockUser],
        nextCursor: null,
        totalCount: 1,
      });

      const result = await controller.findAll(filters);

      expect(result).toEqual({
        data: { items: [mockUser], nextCursor: null, totalCount: 1 },
        message: 'Users fetched successfully',
      });
      expect(service.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return a single user by uid', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual({
        data: mockUser,
        message: 'User fetched successfully',
      });
      expect(service.findOne).toHaveBeenCalledWith('1', USERSELECT.findOne);
    });
  });

  describe('findMe', () => {
    it('should return the authenticated user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockUsersService.findOne.mockResolvedValue(mockUserFindMe);

      const result = await controller.findMe(mockRequest as any);

      expect(result.data).toBeDefined();
      expect(result.data.uid).toBe('1');
      expect(result.data.email).toBe('test@test.com');
      expect(result.data.profileStatus).toBe('INCOMPLETE');
      expect(result.message).toBe('User fetched successfully');
      expect(service.findOne).toHaveBeenCalledWith('1', USERSELECT.findMe);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user by email', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await controller.findOneByEmail('test@test.com');

      expect(result).toEqual({
        data: mockUser,
        message: 'User fetched successfully',
      });
      expect(service.findOneByEmail).toHaveBeenCalledWith('test@test.com');
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

      const result = await controller.update(mockRequest as any, updateDto);

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

      const result = await controller.update(mockRequest as any, updateDto, mockFiles);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith('1', updateDto, {
        file: mockFiles[0].buffer,
        name: mockFiles[0].originalname,
      });
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

      const result = await controller.updatePassword(mockRequest as any, updatePasswordDto);

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

      const result = await controller.updateEmail(mockRequest as any, updateEmailDto);

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

      await expect(controller.updateEmail(mockRequest as any, updateEmailDto)).rejects.toThrow(
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

      const result = await controller.deactivate(mockRequest as any);

      expect(result).toEqual({
        message: 'User 1 has been deactivated',
      });
      expect(service.deactivate).toHaveBeenCalledWith('1');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      mockUsersService.remove.mockResolvedValue({
        message: 'User 1 has been deleted',
      });

      const result = await controller.remove(mockRequest as any);

      expect(result).toEqual({
        message: 'User 1 has been deleted',
      });
      expect(service.remove).toHaveBeenCalledWith('1');
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

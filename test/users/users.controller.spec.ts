import { Test, TestingModule } from '@nestjs/testing';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UpdatePasswordDto, UpdateUserDto, UserFilterDto } from 'src/users/dto';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';

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
  };

  const mockUser = {
    bio: 'test bio',
    firstname: 'John',
    uid: '1',
    imageUrl: 'test-url',
    lastname: 'Doe',
    name: 'Test User',
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
        status: 200,
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
        status: 200,
      });
      expect(service.findOne).toHaveBeenCalledWith('1', USERSELECT.findOne);
    });
  });

  describe('findMe', () => {
    it('should return the authenticated user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };

      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findMe(mockRequest as any);

      expect(result).toEqual({
        data: mockUser,
        message: 'User fetched successfully',
        status: 200,
      });
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
        status: 200,
      });
      expect(service.findOneByEmail).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      const updateDto: UpdateUserDto = {
        firstname: 'Updated Name',
      };
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await controller.update(mockRequest as any, updateDto);

      expect(result).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
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
        status: 200,
      });

      const result = await controller.updatePassword(mockRequest as any, updatePasswordDto);

      expect(result).toEqual({
        message: 'User password updated successfully',
        status: 200,
      });
      expect(service.updatePassword).toHaveBeenCalledWith('1', updatePasswordDto);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const mockRequest = {
        user: { uid: '1' },
      };
      mockUsersService.deactivate.mockResolvedValue({
        message: 'User 1 has been deactivated',
        status: 200,
      });

      const result = await controller.deactivate(mockRequest as any);

      expect(result).toEqual({
        message: 'User 1 has been deactivated',
        status: 200,
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
        status: 200,
      });

      const result = await controller.remove(mockRequest as any);

      expect(result).toEqual({
        message: 'User 1 has been deleted',
        status: 200,
      });
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});

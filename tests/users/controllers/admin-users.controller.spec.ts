import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AdminUsersController } from 'src/users/controllers/admin-users.controller';
import { UsersService } from 'src/users/users.service';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let usersService: UsersService;

  const mockUsersService = {
    adminDeleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deleteUser', () => {
    it('should call usersService.adminDeleteUser with correct userUid', async () => {
      const userUid = 'valid-uid';
      const expectedResult = { success: true };

      mockUsersService.adminDeleteUser.mockResolvedValue(expectedResult);

      const result = await controller.deleteUser(userUid);

      expect(usersService.adminDeleteUser).toHaveBeenCalledWith(userUid);
      expect(usersService.adminDeleteUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should surface exceptions thrown by the service', async () => {
      const userUid = 'valid-uid';
      const error = new Error('Deletion failed');

      mockUsersService.adminDeleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser(userUid)).rejects.toThrow(error);
    });
  });
});

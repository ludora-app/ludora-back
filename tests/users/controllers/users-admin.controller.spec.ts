import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { UsersAdminController } from 'src/users/controllers/users-admin.controller';
import { UsersService } from 'src/users/services/users.service';
import { UsersAdminService } from 'src/users/services/users-admin.service';

describe('UsersAdminController', () => {
  let controller: UsersAdminController;
  let usersAdminService: UsersAdminService;

  const mockUsersAdminService = {
    adminDeleteUser: jest.fn(),
    findAllUsersOrderedByReports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersAdminController],
      providers: [
        {
          provide: UsersAdminService,
          useValue: mockUsersAdminService,
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersAdminController>(UsersAdminController);
    usersAdminService = module.get<UsersAdminService>(UsersAdminService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deleteUser', () => {
    it('should call usersAdminService.adminDeleteUser with correct userUid', async () => {
      const userUid = 'valid-uid';
      const expectedResult = { success: true };

      mockUsersAdminService.adminDeleteUser.mockResolvedValue(expectedResult);

      const result = await controller.deleteUser(userUid);

      expect(usersAdminService.adminDeleteUser).toHaveBeenCalledWith(userUid);
      expect(usersAdminService.adminDeleteUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should surface exceptions thrown by the service', async () => {
      const userUid = 'valid-uid';
      const error = new Error('Deletion failed');

      mockUsersAdminService.adminDeleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser(userUid)).rejects.toThrow(error);
    });
  });

  describe('findAllUsersOrderedByReports', () => {
    it('should return paginated users and success message', async () => {
      const params = { limit: 10, reportReason: 'SPAM' } as any;
      const expectedData = {
        items: [{ uid: 'user1', reportCount: 2 }],
        totalCount: 1,
        nextCursor: null,
      };

      mockUsersAdminService.findAllUsersOrderedByReports = jest
        .fn()
        .mockResolvedValue(expectedData);

      const result = await controller.findAllUsersOrderedByReports(params);

      expect(usersAdminService.findAllUsersOrderedByReports).toHaveBeenCalledWith(params);
      expect(usersAdminService.findAllUsersOrderedByReports).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        data: expectedData,
        message: 'Users fetched successfully',
      });
    });

    it('should surface exceptions thrown by the service', async () => {
      const params = {} as any;
      const error = new Error('Fetch failed');

      mockUsersAdminService.findAllUsersOrderedByReports = jest.fn().mockRejectedValue(error);

      await expect(controller.findAllUsersOrderedByReports(params)).rejects.toThrow(error);
    });
  });
});

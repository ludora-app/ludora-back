import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from 'src/notifications/notifications.controller';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationTypeFilter } from 'src/notifications/dto/input/notification-filter.dto';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    findAllByUserUid: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    sendPushNotificationByToken: jest.fn(),
    createMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    })
      .overrideGuard(require('src/auth/guards/auth-b2c.guard').AuthB2CGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('src/shared/guards/dev-only.guard').DevOnlyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllByUserUid with user uid and pass through query filters', async () => {
      const mockReq = { user: { uid: 'user-123' } };
      const filters = {
        cursor: 'cursor-abc',
        limit: 15,
        type: NotificationTypeFilter.SESSION,
      };
      const mockNotifications = {
        items: [],
        nextCursor: null,
        totalCount: 0,
      };
      mockNotificationsService.findAllByUserUid.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(mockReq as any, filters as any);

      expect(mockNotificationsService.findAllByUserUid).toHaveBeenCalledWith('user-123', filters);
      expect(result).toEqual({
        data: mockNotifications,
        message: 'Notifications fetched successfully',
      });
    });

    it('should return paginated response with empty filters', async () => {
      const mockReq = { user: { uid: 'user-456' } };
      const filters = {};
      const mockNotifications = {
        items: [{ uid: 'notif-1', title: 'Test' }],
        nextCursor: null,
        totalCount: 1,
      };
      mockNotificationsService.findAllByUserUid.mockResolvedValue(mockNotifications);

      const result = await controller.findAll(mockReq as any, filters as any);

      expect(mockNotificationsService.findAllByUserUid).toHaveBeenCalledWith('user-456', {});
      expect(result.data).toEqual(mockNotifications);
      expect(result.message).toBe('Notifications fetched successfully');
    });

    it('should pass type FRIEND filter to service', async () => {
      const mockReq = { user: { uid: 'user-789' } };
      const filters = { type: NotificationTypeFilter.FRIEND };
      mockNotificationsService.findAllByUserUid.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.findAll(mockReq as any, filters as any);

      expect(mockNotificationsService.findAllByUserUid).toHaveBeenCalledWith('user-789', {
        type: NotificationTypeFilter.FRIEND,
      });
    });
  });
});

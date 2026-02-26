import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { DevicesService } from 'src/devices/devices.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { NotificationTypeFilter } from 'src/notifications/dto/input/notification-filter.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockFindMany: jest.Mock;
  let mockCreateMany: jest.Mock;

  const mockPrismaService = {};

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockFirebaseService = {
    sendMulticastMessage: jest.fn(),
  };

  const mockDevicesService = {
    findByUserUid: jest.fn(),
  };

  const mockNotification = {
    uid: 'notif-1',
    userUid: 'user-1',
    type: NotificationType.SESSION_INVITATION,
    title: 'Title',
    body: 'Body',
    data: {},
    isRead: false,
    readAt: null,
    sentViaPush: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockFindMany = jest.fn().mockResolvedValue([mockNotification]);
    mockCreateMany = jest.fn().mockResolvedValue({ count: 0 });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            ...mockPrismaService,
            notifications: { findMany: mockFindMany, createMany: mockCreateMany },
          },
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUserUid', () => {
    it('should call prisma with userUid and default limit 20 when no filters', async () => {
      await service.findAllByUserUid('user-1', {});

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userUid: 'user-1',
            type: {
              notIn: [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_DELETED],
            },
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should apply cursor and limit when provided in filters', async () => {
      await service.findAllByUserUid('user-1', {
        cursor: 'cursor-uid-123',
        limit: 10,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userUid: 'user-1',
            type: {
              notIn: [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_DELETED],
            },
          },
          take: 10,
          cursor: { uid: 'cursor-uid-123' },
          skip: 1,
        }),
      );
    });

    it('should filter by type SESSION when type is NotificationTypeFilter.SESSION', async () => {
      await service.findAllByUserUid('user-1', {
        type: NotificationTypeFilter.SESSION,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userUid: 'user-1',
            type: {
              in: [
                NotificationType.SESSION_INVITATION,
                NotificationType.SESSION_UPDATED,
                NotificationType.SESSION_CANCELLED,
                NotificationType.SESSION_REMINDER,
              ],
            },
          },
        }),
      );
    });

    it('should filter by type FRIEND when type is NotificationTypeFilter.FRIEND', async () => {
      await service.findAllByUserUid('user-1', {
        type: NotificationTypeFilter.FRIEND,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userUid: 'user-1',
            type: {
              in: [NotificationType.FRIEND_ACCEPTED, NotificationType.FRIEND_REQUEST],
            },
          },
        }),
      );
    });

    it('should return items, nextCursor and totalCount', async () => {
      mockFindMany.mockResolvedValueOnce([mockNotification]);

      const result = await service.findAllByUserUid('user-1', { limit: 5 });

      expect(result).toEqual(
        expect.objectContaining({
          items: expect.any(Array),
          nextCursor: null,
          totalCount: 1,
        }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        uid: mockNotification.uid,
        type: mockNotification.type,
        title: mockNotification.title,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count as data object with default exclusion of messages', async () => {
      const mockCount = jest.fn().mockResolvedValue(5);
      // @ts-expect-error
      service.prisma.notifications.count = mockCount;

      const result = await service.getUnreadCount('user-1');

      expect(mockCount).toHaveBeenCalledWith({
        where: {
          isRead: false,
          userUid: 'user-1',
          type: {
            notIn: [NotificationType.NEW_MESSAGE, NotificationType.MESSAGE_DELETED],
          },
        },
      });
      expect(result).toEqual({ unreadCount: 5 });
    });

    it('should filter by SESSION types when provided', async () => {
      const mockCount = jest.fn().mockResolvedValue(2);
      // @ts-expect-error
      service.prisma.notifications.count = mockCount;

      const result = await service.getUnreadCount('user-1', {
        type: NotificationTypeFilter.SESSION,
      });

      expect(mockCount).toHaveBeenCalledWith({
        where: {
          isRead: false,
          userUid: 'user-1',
          type: {
            in: [
              NotificationType.SESSION_INVITATION,
              NotificationType.SESSION_UPDATED,
              NotificationType.SESSION_CANCELLED,
              NotificationType.SESSION_REMINDER,
            ],
          },
        },
      });
      expect(result).toEqual({ unreadCount: 2 });
    });
  });
});

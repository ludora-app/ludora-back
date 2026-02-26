import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sport } from 'src/shared/constants/constants';
import { UsersService } from 'src/users/users.service';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  const mockPrismaService = {};
  const mockJwtService = {};
  const mockUsersService = {};
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockWebSocketAuthService = {
    authenticateSocket: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByReceiver: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  const mockWebSocketAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: WebSocketAuthService,
          useValue: mockWebSocketAuthService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    })
      .overrideGuard(WebSocketAuthGuard)
      .useValue(mockWebSocketAuthGuard)
      .compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should join authenticated user to notification room', async () => {
      const userUid = 'user-123';
      const unreadCount = 5;

      mockNotificationsService.getUnreadCount.mockResolvedValue(unreadCount);

      const mockAuthenticatedSocket = {
        id: 'socket-123',
        data: { userUid },
        join: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith(`user:${userUid}`);
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith('connected', {
        message: 'Successfully connected to notifications',
        unreadCount,
        userUid,
      });
    });

    it('should handle connection errors gracefully', async () => {
      const mockErrorSocket = {
        id: 'socket-123',
        data: { userUid: 'user-123' },
        join: jest.fn().mockRejectedValue(new Error('Connection failed')),
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      await gateway.handleConnection(mockErrorSocket);

      expect(mockErrorSocket.emit).toHaveBeenCalledWith('error', {
        code: 'CONNECTION_FAILED',
        message: 'Connection failed',
      });
      expect(mockErrorSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleNotificationSend', () => {
    it('should send notification to specific user', async () => {
      const payload = {
        userId: 'user-123',
        type: NotificationType.FRIEND_REQUEST,
        title: 'New Friend Request',
        message: 'John Doe sent you a friend request',
        data: { requestId: 'req-456' },
      };

      mockNotificationsService.create.mockResolvedValue({
        uid: 'notif-123',
        createdAt: new Date(),
      });

      const mockEmit = jest.fn();
      const mockServerTo = jest.fn().mockReturnValue({
        emit: mockEmit,
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      // Simulate a connected user
      gateway['connectedUsers'].set('user-123', new Set(['socket-123']));

      await gateway.handleNotificationSend(payload);

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
      expect(mockEmit).toHaveBeenCalledWith('notification', expect.any(Object));
    });
  });

  describe('handleNotificationBroadcast', () => {
    it('should broadcast notification to all users', () => {
      const payload = {
        type: NotificationType.GENERAL,
        title: 'System Maintenance',
        message: 'Maintenance in 10 minutes',
      };

      const mockServerEmit = jest.fn();
      gateway.server = {
        emit: mockServerEmit,
      } as any;

      gateway.handleNotificationBroadcast(payload);

      expect(mockServerEmit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'GENERAL',
          title: 'System Maintenance',
          message: 'Maintenance in 10 minutes',
        }),
      );
    });
  });

  describe('handleNotificationSendToMultiple', () => {
    it('should send notification to multiple users', async () => {
      const payload = {
        userIds: ['user-1', 'user-2', 'user-3'],
        type: NotificationType.SESSION_REMINDER,
        title: 'Session Starting Soon',
        message: 'Your session starts in 30 minutes',
        data: { sessionId: 'session-123' },
      };

      mockNotificationsService.create.mockResolvedValue({
        uid: 'notif-123',
        createdAt: new Date(),
      });

      const mockEmit = jest.fn();
      const mockServerTo = jest.fn().mockReturnValue({
        emit: mockEmit,
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      // Simulate connected users
      gateway['connectedUsers'].set('user-1', new Set(['socket-1']));
      gateway['connectedUsers'].set('user-2', new Set(['socket-2']));
      gateway['connectedUsers'].set('user-3', new Set(['socket-3']));

      await gateway.handleNotificationSendToMultiple(payload);

      expect(mockServerTo).toHaveBeenCalledTimes(3);
      expect(mockServerTo).toHaveBeenCalledWith('user:user-1');
      expect(mockServerTo).toHaveBeenCalledWith('user:user-2');
      expect(mockServerTo).toHaveBeenCalledWith('user:user-3');
    });
  });

  describe('handleFriendRequestNotification', () => {
    it('should send friend request notification', async () => {
      const payload = {
        recipientId: 'user-123',
        senderId: 'user-456',
        senderName: 'John Doe',
        requestId: 'req-789',
      };

      mockNotificationsService.create.mockResolvedValue({
        uid: 'notif-123',
        createdAt: new Date(),
      });

      const mockEmit = jest.fn();
      const mockServerTo = jest.fn().mockReturnValue({
        emit: mockEmit,
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      // Simulate a connected user
      gateway['connectedUsers'].set('user-123', new Set(['socket-123']));

      await gateway.handleFriendRequestNotification(payload);

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
      expect(mockEmit).toHaveBeenCalledWith('notification', expect.any(Object));
    });
  });

  describe('handleSessionInvitationNotification', () => {
    it('should send session invitation notification', async () => {
      const payload = {
        sessionUid: 'session-456',
        sessionTitle: 'Basketball Game',
        sessionDate: '2025-06-01',
        senderFirstname: 'Jane',
        senderLastname: 'Smith',
        sessionSport: Sport.BASKETBALL,
        senderAvatar: 'https://example.com/avatar.jpg',
        senderUid: 'user-sender',
      };

      mockNotificationsService.create.mockResolvedValue({
        uid: 'notif-123',
        createdAt: new Date(),
      });

      const mockEmit = jest.fn();
      const mockServerTo = jest.fn().mockReturnValue({
        emit: mockEmit,
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      // Simulate a connected user
      gateway['connectedUsers'].set('user-123', new Set(['socket-123']));

      await gateway.handleSessionInvitationNotification(payload, 'user-123');

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
      expect(mockEmit).toHaveBeenCalledWith('notification', expect.any(Object));
    });
  });

  describe('handleDisconnect', () => {
    it('should log user disconnection', () => {
      const mockAuthenticatedSocket = {
        id: 'socket-123',
        data: { userUid: 'user-123' },
      } as unknown as Socket;

      // Set up a connected user with the socket
      gateway['connectedUsers'].set('user-123', new Set(['socket-123']));

      gateway.handleDisconnect(mockAuthenticatedSocket);

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('User user-123'));
    });

    it('should handle unauthenticated socket disconnection', () => {
      const mockUnauthenticatedSocket = {
        id: 'socket-123',
        data: {},
      } as unknown as Socket;

      gateway.handleDisconnect(mockUnauthenticatedSocket);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Unauthenticated socket'),
      );
    });
  });
});

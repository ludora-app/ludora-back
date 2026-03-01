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
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  const mockWebSocketAuthService = {
    authenticateSocket: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByReceiver: jest.fn(),
    findOne: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
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
        data: { userUid },
        disconnect: jest.fn(),
        emit: jest.fn(),
        id: 'socket-123',
        join: jest.fn(),
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
        data: { userUid: 'user-123' },
        disconnect: jest.fn(),
        emit: jest.fn(),
        id: 'socket-123',
        join: jest.fn().mockRejectedValue(new Error('Connection failed')),
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
        data: { requestId: 'req-456' },
        message: 'John Doe sent you a friend request',
        title: 'New Friend Request',
        type: NotificationType.FRIEND_REQUEST,
        userId: 'user-123',
      };

      mockNotificationsService.create.mockResolvedValue({
        createdAt: new Date(),
        uid: 'notif-123',
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
        message: 'Maintenance in 10 minutes',
        title: 'System Maintenance',
        type: NotificationType.GENERAL,
      };

      const mockServerEmit = jest.fn();
      gateway.server = {
        emit: mockServerEmit,
      } as any;

      gateway.handleNotificationBroadcast(payload);

      expect(mockServerEmit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          message: 'Maintenance in 10 minutes',
          title: 'System Maintenance',
          type: 'GENERAL',
        }),
      );
    });
  });

  describe('handleNotificationSendToMultiple', () => {
    it('should send notification to multiple users', async () => {
      const payload = {
        data: { sessionId: 'session-123' },
        message: 'Your session starts in 30 minutes',
        title: 'Session Starting Soon',
        type: NotificationType.SESSION_REMINDER,
        userIds: ['user-1', 'user-2', 'user-3'],
      };

      mockNotificationsService.create.mockResolvedValue({
        createdAt: new Date(),
        uid: 'notif-123',
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
        requestId: 'req-789',
        senderId: 'user-456',
        senderName: 'John Doe',
      };

      mockNotificationsService.create.mockResolvedValue({
        createdAt: new Date(),
        uid: 'notif-123',
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
        senderAvatar: 'https://example.com/avatar.jpg',
        senderFirstname: 'Jane',
        senderLastname: 'Smith',
        senderUid: 'user-sender',
        sessionDate: '2025-06-01',
        sessionSport: Sport.BASKETBALL,
        sessionTitle: 'Basketball Game',
        sessionUid: 'session-456',
      };

      mockNotificationsService.create.mockResolvedValue({
        createdAt: new Date(),
        uid: 'notif-123',
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
        data: { userUid: 'user-123' },
        id: 'socket-123',
      } as unknown as Socket;

      // Set up a connected user with the socket
      gateway['connectedUsers'].set('user-123', new Set(['socket-123']));

      gateway.handleDisconnect(mockAuthenticatedSocket);

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('User user-123'));
    });

    it('should handle unauthenticated socket disconnection', () => {
      const mockUnauthenticatedSocket = {
        data: {},
        id: 'socket-123',
      } as unknown as Socket;

      gateway.handleDisconnect(mockUnauthenticatedSocket);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Unauthenticated socket'),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationType } from 'src/shared/constants/constants';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockSocket = {
    id: 'socket-123',
    data: {},
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
  } as unknown as Socket;

  const mockPrismaService = {
    userTokens: {
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
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
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate user and join notification room', async () => {
      const userUid = 'user-123';

      mockJwtService.verifyAsync.mockResolvedValue({ uid: userUid });
      mockPrismaService.userTokens.findFirst.mockResolvedValue({
        uid: 'token-uid',
        token: 'valid-token',
        userUid,
      });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(prismaService.userTokens.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'valid-token',
          userUid,
        },
      });
      expect(mockSocket.data.userUid).toBe(userUid);
      expect(mockSocket.join).toHaveBeenCalledWith(`user:${userUid}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        message: 'Successfully connected to notifications',
        userUid,
      });
    });

    it('should disconnect if no token provided', async () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { auth: {} },
      } as unknown as Socket;

      await gateway.handleConnection(socketWithoutToken);

      expect(socketWithoutToken.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      expect(socketWithoutToken.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleNotificationSend', () => {
    it('should send notification to specific user', () => {
      const payload = {
        userId: 'user-123',
        type: NotificationType.FRIEND_REQUEST,
        title: 'New Friend Request',
        message: 'John Doe sent you a friend request',
        data: { requestId: 'req-456' },
      };

      const mockServerTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      gateway.handleNotificationSend(payload);

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
    });
  });

  describe('handleNotificationBroadcast', () => {
    it('should broadcast notification to all users', () => {
      const payload = {
        type: 'GENERAL',
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
    it('should send notification to multiple users', () => {
      const payload = {
        userIds: ['user-1', 'user-2', 'user-3'],
        type: 'SESSION_REMINDER',
        title: 'Session Starting Soon',
        message: 'Your session starts in 30 minutes',
        data: { sessionId: 'session-123' },
      };

      const mockServerTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      gateway.handleNotificationSendToMultiple(payload);

      expect(mockServerTo).toHaveBeenCalledTimes(3);
      expect(mockServerTo).toHaveBeenCalledWith('user:user-1');
      expect(mockServerTo).toHaveBeenCalledWith('user:user-2');
      expect(mockServerTo).toHaveBeenCalledWith('user:user-3');
    });
  });

  describe('handleFriendRequestNotification', () => {
    it('should send friend request notification', () => {
      const payload = {
        recipientId: 'user-123',
        senderId: 'user-456',
        senderName: 'John Doe',
        requestId: 'req-789',
      };

      const mockServerTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      gateway.handleFriendRequestNotification(payload);

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
    });
  });

  describe('handleSessionInvitationNotification', () => {
    it('should send session invitation notification', () => {
      const payload = {
        recipientId: 'user-123',
        sessionName: 'Basketball Game',
        sessionId: 'session-456',
        invitedBy: 'Jane Smith',
      };

      const mockServerTo = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
      gateway.server = {
        to: mockServerTo,
      } as any;

      gateway.handleSessionInvitationNotification(payload);

      expect(mockServerTo).toHaveBeenCalledWith('user:user-123');
    });
  });

  describe('handleDisconnect', () => {
    it('should log user disconnection', () => {
      mockSocket.data.userUid = 'user-123';

      gateway.handleDisconnect(mockSocket);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('User user-123 disconnected'),
      );
    });

    it('should handle unauthenticated socket disconnection', () => {
      mockSocket.data.userUid = undefined;

      gateway.handleDisconnect(mockSocket);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Unauthenticated socket'),
      );
    });
  });
});

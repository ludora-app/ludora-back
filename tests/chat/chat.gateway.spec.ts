import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { WebSocketAuthService } from 'src/auth/services/websocket-auth.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { MessagesService } from 'src/conversations/services/messages.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: MessagesService;
  let _conversationsService: ConversationsService;
  let prismaService: PrismaService;
  let _jwtService: JwtService;

  const mockServer = {
    emit: jest.fn(),
    except: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
  };

  const mockSocket = {
    data: {},
    disconnect: jest.fn(),
    emit: jest.fn(),
    handshake: {
      auth: {
        token: 'valid-token',
      },
    },
    id: 'socket-123',
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
  } as unknown as Socket;

  const mockMessagesService = {
    createMessage: jest.fn(),
    getMessages: jest.fn(),
    markMessagesAsRead: jest.fn(),
  };

  const mockConversationsService = {
    createMessage: jest.fn(),
    getConversationByUid: jest.fn(),
    getConversations: jest.fn(),
  };

  const mockPrismaService = {
    conversationMembers: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userTokens: {
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

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

  const mockWebSocketAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
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
      ],
    })
      .overrideGuard(WebSocketAuthGuard)
      .useValue(mockWebSocketAuthGuard)
      .compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = mockServer as any;
    messagesService = module.get<MessagesService>(MessagesService);
    _conversationsService = module.get<ConversationsService>(ConversationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    _jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should join authenticated user to rooms and emit connected event', async () => {
      const userUid = 'user-123';
      const conversationUid = 'conv-456';
      const mockAuthenticatedSocket = {
        data: { userUid },
        emit: jest.fn(),
        id: 'socket-123',
        join: jest.fn(),
      } as unknown as Socket;

      mockPrismaService.conversationMembers.findMany.mockResolvedValue([{ conversationUid }]);

      await gateway.handleConnection(mockAuthenticatedSocket);

      expect(prismaService.conversationMembers.findMany).toHaveBeenCalledWith({
        select: {
          conversationUid: true,
        },
        where: {
          userUid,
        },
      });
      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith(`user:${userUid}`);
      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith(`conversation:${conversationUid}`);
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith('connected', {
        conversations: [conversationUid],
        message: 'Successfully connected to chat',
        userUid,
      });
    });

    it('should handle connection errors gracefully', async () => {
      const userUid = 'user-123';
      const mockErrorSocket = {
        data: { userUid },
        disconnect: jest.fn(),
        emit: jest.fn(),
        id: 'socket-123',
        join: jest.fn(),
      } as unknown as Socket;

      mockPrismaService.conversationMembers.findMany.mockRejectedValue(new Error('Database error'));

      await gateway.handleConnection(mockErrorSocket);

      expect(mockErrorSocket.emit).toHaveBeenCalledWith('error', {
        code: 'CONNECTION_FAILED',
        message: 'Connection failed',
      });
      expect(mockErrorSocket.disconnect).toHaveBeenCalled();
    });
  });

  // describe('handleSendMessage', () => {
  //   beforeEach(() => {
  //     mockSocket.data.userUid = 'user-123';
  //   });

  //   it('should create and broadcast a message', async () => {
  //     const messageData = {
  //       conversationUid: 'conv-456',
  //       content: 'Hello world',
  //       type: MessageType.TEXT,
  //     };

  //     const createdMessage = {
  //       uid: 'msg-789',
  //       content: 'Hello world',
  //       conversationUid: 'conv-456',
  //       senderUid: 'user-123',
  //       type: MessageType.TEXT,
  //       createdAt: new Date(),
  //     };

  //     mockMessagesService.createMessage.mockResolvedValue(createdMessage);

  //     // Mock server.to().emit()
  //     const mockServerTo = jest.fn().mockReturnValue({
  //       emit: jest.fn(),
  //     });
  //     gateway.server = {
  //       to: mockServerTo,
  //     } as any;

  //     await gateway.handleSendMessage(mockSocket, messageData);

  //     expect(messagesService.createMessage).toHaveBeenCalledWith(
  //       'user-123',
  //       'Hello world',
  //       'conv-456',
  //       MessageType.TEXT,
  //     );
  //     expect(mockServerTo).toHaveBeenCalledWith('conversation:conv-456');
  //   });

  //   it('should emit error if user is not authenticated', async () => {
  //     mockSocket.data.userUid = undefined;

  //     await gateway.handleSendMessage(mockSocket, {
  //       conversationUid: 'conv-456',
  //       content: 'Hello',
  //       type: MessageType.TEXT,
  //     });

  //     expect(mockSocket.emit).toHaveBeenCalledWith('error', {
  //       message: 'Unauthorized',
  //       code: 'UNAUTHORIZED',
  //     });
  //     expect(messagesService.createMessage).not.toHaveBeenCalled();
  //   });
  // });

  describe('handleJoinConversation', () => {
    beforeEach(() => {
      mockSocket.data.userUid = 'user-123';
    });

    it('should allow user to join conversation if they are a member', async () => {
      const conversationUid = 'conv-456';

      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-uid',
        userUid: 'user-123',
      });

      await gateway.handleJoinConversation(mockSocket, { conversationUid });

      expect(prismaService.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid,
          userUid: 'user-123',
        },
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`conversation:${conversationUid}`);
      expect(mockSocket.emit).toHaveBeenCalledWith('joinedConversation', {
        conversationUid,
        message: 'Successfully joined conversation',
      });
    });

    it('should reject if user is not a member', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await gateway.handleJoinConversation(mockSocket, { conversationUid: 'conv-456' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'NOT_MEMBER',
        message: 'You are not a member of this conversation',
      });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleTyping', () => {
    beforeEach(() => {
      mockSocket.data.userUid = 'user-123';
      mockSocket.to = jest.fn().mockReturnValue({
        emit: jest.fn(),
      });
    });

    it('should broadcast typing indicator to conversation', async () => {
      const typingData = {
        conversationUid: 'conv-456',
        isTyping: true,
      };

      await gateway.handleTyping(mockSocket, typingData);

      expect(mockSocket.to).toHaveBeenCalledWith('conversation:conv-456');
    });
  });

  describe('handleMarkAsReadEvent', () => {
    it('should mark messages as read and notify conversation room', async () => {
      const conversationUid = 'conv-456';
      const userUid = 'user-123';
      const messages = [{ hasAnyRead: true, hasEveryoneRead: false, uid: 'msg-1' }];
      mockMessagesService.markMessagesAsRead.mockResolvedValue({ count: 5, messages });

      await gateway.handleMarkAsReadEvent({ conversationUid, userUid });

      expect(messagesService.markMessagesAsRead).toHaveBeenCalledWith(conversationUid, userUid);
      expect(mockServer.to).toHaveBeenCalledWith(`conversation:${conversationUid}`);
      expect(mockServer.except).toHaveBeenCalledWith(`user:${userUid}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        data: {
          conversationUid,
          messages,
          userUid,
        },
        message: `${userUid} marked 5 messages from ${conversationUid} as read`,
        type: NotificationType.MESSAGES_READ,
      });
      expect(mockServer.to).toHaveBeenCalledWith(`user:${userUid}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        data: {
          conversationUid,
          messages,
          userUid,
        },
        message: `${userUid} marked 5 messages from ${conversationUid} as read`,
        type: NotificationType.CONVERSATION_READ,
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should log user disconnection', () => {
      mockSocket.data.userUid = 'user-123';

      gateway.handleDisconnect(mockSocket);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('User user-123 disconnected'),
      );
    });

    it('should handle unauthenticated socket disconnection', () => {
      mockSocket.data.userUid = undefined;

      gateway.handleDisconnect(mockSocket);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Unauthenticated socket'),
      );
    });
  });

  describe('handleMessageDeletedEvent', () => {
    it('should notify conversation room when a message is deleted', async () => {
      const payload = {
        conversationUid: 'conv-123',
        messageUid: 'msg-456',
        userUid: 'user-789',
      };

      await gateway.handleMessageDeletedEvent(payload);

      expect(mockServer.to).toHaveBeenCalledWith('conversation:conv-123');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        data: {
          conversationUid: 'conv-123',
          messageUid: 'msg-456',
          userUid: 'user-789',
        },
        message: expect.stringContaining('Message msg-456 was deleted'),
        type: NotificationType.MESSAGE_DELETED,
      });
    });
  });
});

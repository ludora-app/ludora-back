import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from 'src/conversations/conversations.service';
import { MessagesService } from 'src/conversations/messages.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConversationType, MessageType } from 'generated/prisma/enums';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let mockPrismaService: any;
  let mockMessagesService: any;

  const mockPinoLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
      conversationMembers: {
        createMany: jest.fn(),
        findFirst: jest.fn(),
      },
      conversations: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockMessagesService = {
      createTextMessage: jest.fn(),
      createMediaMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
        },
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSessionConversation', () => {
    const createSessionConversationDto = {
      name: 'Test Session',
      sessionUid: 'session-123',
      type: ConversationType.SESSION,
      userUids: ['user-1', 'user-2'],
    };

    it('should create a session conversation without transaction', async () => {
      const mockConversation = {
        name: 'Test Session',
        sessionUid: 'session-123',
        type: ConversationType.SESSION,
        uid: 'conv-123',
      };

      mockPrismaService.conversations.create.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 2 });

      await service.createSessionConversation(createSessionConversationDto);

      expect(mockPrismaService.conversations.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Session',
          sessionUid: 'session-123',
          type: ConversationType.SESSION,
        },
      });

      expect(mockPrismaService.conversationMembers.createMany).toHaveBeenCalledWith({
        data: [
          { conversationUid: 'conv-123', userUid: 'user-1' },
          { conversationUid: 'conv-123', userUid: 'user-2' },
        ],
      });

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should create a session conversation with transaction', async () => {
      const mockTx = {
        conversationMembers: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        conversations: {
          create: jest.fn().mockResolvedValue({ uid: 'conv-456' }),
        },
      };

      await service.createSessionConversation(createSessionConversationDto, mockTx as any);

      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockTx.conversationMembers.createMany).toHaveBeenCalled();
      expect(mockPrismaService.conversations.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when sessionUid is missing', async () => {
      const invalidDto = {
        ...createSessionConversationDto,
        sessionUid: '',
      };

      await expect(service.createSessionConversation(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSessionConversation(invalidDto)).rejects.toThrow(
        'Session uid is required',
      );
    });

    it('should create conversation members for all user uids', async () => {
      const mockConversation = { uid: 'conv-789' };
      mockPrismaService.conversations.create.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 3 });

      const dtoWithMultipleUsers = {
        ...createSessionConversationDto,
        userUids: ['user-1', 'user-2', 'user-3'],
      };

      await service.createSessionConversation(dtoWithMultipleUsers);

      expect(mockPrismaService.conversationMembers.createMany).toHaveBeenCalledWith({
        data: [
          { conversationUid: 'conv-789', userUid: 'user-1' },
          { conversationUid: 'conv-789', userUid: 'user-2' },
          { conversationUid: 'conv-789', userUid: 'user-3' },
        ],
      });
    });
  });

  describe('createPrivateConversation', () => {
    const createPrivateConversationDto = {
      type: ConversationType.PRIVATE,
      userUids: ['user-1', 'user-2'],
    };

    it('should create a private conversation without transaction', async () => {
      const mockConversation = {
        type: ConversationType.PRIVATE,
        uid: 'conv-private-123',
      };

      mockPrismaService.conversations.create.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 2 });

      await service.createPrivateConversation(createPrivateConversationDto);

      expect(mockPrismaService.conversations.create).toHaveBeenCalledWith({
        data: {
          type: ConversationType.PRIVATE,
        },
      });

      expect(mockPrismaService.conversationMembers.createMany).toHaveBeenCalledWith({
        data: [
          { conversationUid: 'conv-private-123', userUid: 'user-1' },
          { conversationUid: 'conv-private-123', userUid: 'user-2' },
        ],
      });
    });

    it('should create a private conversation with transaction', async () => {
      const mockTx = {
        conversationMembers: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        conversations: {
          create: jest.fn().mockResolvedValue({ uid: 'conv-private-456' }),
        },
      };

      await service.createPrivateConversation(createPrivateConversationDto, mockTx as any);

      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockTx.conversationMembers.createMany).toHaveBeenCalled();
    });
  });

  describe('findAllByUserUid', () => {
    const mockConversations = [
      {
        messages: [{ content: 'Last message', createdAt: new Date(), uid: 'msg-1' }],
        name: 'Group 1',
        type: ConversationType.GROUP,
        uid: 'conv-1',
      },
      {
        messages: [{ content: 'Another message', createdAt: new Date(), uid: 'msg-2' }],
        name: 'Group 2',
        type: ConversationType.GROUP,
        uid: 'conv-2',
      },
    ];

    it('should return paginated conversations with default limit', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);

      const result = await service.findAllByUserUid({}, 'user-123');

      expect(result.items).toEqual(mockConversations);
      expect(result.nextCursor).toBeNull();
      expect(result.totalCount).toBe(2);
      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          where: expect.objectContaining({
            conversationMembers: {
              some: {
                userUid: 'user-123',
              },
            },
          }),
        }),
      );
    });

    it('should filter conversations by type', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue([mockConversations[0]]);

      await service.findAllByUserUid({ type: ConversationType.GROUP }, 'user-123');

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ConversationType.GROUP,
          }),
        }),
      );
    });

    it('should filter conversations by name', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue([mockConversations[0]]);

      await service.findAllByUserUid({ name: 'Group 1' }, 'user-123');

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'Group 1',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should handle pagination with cursor', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);

      await service.findAllByUserUid({ cursor: 'conv-cursor', limit: 10 }, 'user-123');

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { uid: 'conv-cursor' },
          skip: 1,
        }),
      );
    });

    it('should calculate next cursor when more items than limit', async () => {
      const manyConversations = [
        { uid: 'conv-1' },
        { uid: 'conv-2' },
        { uid: 'conv-3' },
        { uid: 'conv-4' },
        { uid: 'conv-5' },
        { uid: 'conv-6' },
      ];
      mockPrismaService.conversations.findMany.mockResolvedValue(manyConversations);

      const result = await service.findAllByUserUid({ limit: 5 }, 'user-123');

      expect(result.items).toHaveLength(5);
      expect(result.nextCursor).toBe('conv-6');
    });

    it('should include last message in conversations', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);

      await service.findAllByUserUid({}, 'user-123');

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        }),
      );
    });

    it('should apply multiple filters together', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue([mockConversations[0]]);

      await service.findAllByUserUid(
        {
          limit: 15,
          name: 'Group',
          type: ConversationType.GROUP,
        },
        'user-123',
      );

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 16,
          where: expect.objectContaining({
            name: {
              contains: 'Group',
              mode: 'insensitive',
            },
            type: ConversationType.GROUP,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockConversation = {
      messages: [
        { content: 'Message 1', uid: 'msg-1' },
        { content: 'Message 2', uid: 'msg-2' },
      ],
      name: 'Test Conversation',
      type: ConversationType.PRIVATE,
      uid: 'conv-123',
    };

    it('should return a conversation if user is a member', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid: 'conv-123',
        userUid: 'user-123',
      });

      const result = await service.findOne('conv-123', 'user-123');

      expect(result).toEqual(mockConversation);
      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
        where: {
          uid: 'conv-123',
        },
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.findOne('conv-123', 'unauthorized-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('conv-123', 'unauthorized-user')).rejects.toThrow(
        'User with uid unauthorized-user is not a member of this conversation',
      );
    });

    it('should include up to 10 most recent messages', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({ userUid: 'user-123' });

      await service.findOne('conv-123', 'user-123');

      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            messages: expect.objectContaining({
              take: 10,
            }),
          },
        }),
      );
    });

    it('should check membership for the correct user and conversation', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({ userUid: 'user-456' });

      await service.findOne('conv-789', 'user-456');

      expect(mockPrismaService.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid: 'conv-789',
          userUid: 'user-456',
        },
      });
    });
  });

  describe('createMockConversation', () => {
    it('should create 15 mock conversations in a transaction', async () => {
      const mockConvs = Array.from({ length: 15 }, (_, i) => ({ uid: `conv-${i}` }));
      let createCallCount = 0;

      mockPrismaService.conversations.create.mockImplementation(() => {
        return Promise.resolve(mockConvs[createCallCount++]);
      });
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 5 });
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await service.createMockConversation('user-123');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.conversations.create).toHaveBeenCalledTimes(15);
      expect(mockPrismaService.conversationMembers.createMany).toHaveBeenCalledTimes(3);
    });

    it('should create 5 private, 5 group, and 5 session conversations', async () => {
      const mockConv = { uid: 'conv-123' };
      mockPrismaService.conversations.create.mockResolvedValue(mockConv);
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 5 });
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await service.createMockConversation('user-123');

      const createCalls = mockPrismaService.conversations.create.mock.calls;

      // Check private conversations (first 5)
      expect(createCalls.slice(0, 5)).toEqual(
        Array(5).fill([{ data: { type: ConversationType.PRIVATE } }]),
      );

      // Check group conversations (next 5)
      for (let i = 5; i < 10; i++) {
        expect(createCalls[i][0].data.type).toBe(ConversationType.GROUP);
        expect(createCalls[i][0].data.name).toContain('Group');
      }

      // Check session conversations (last 5)
      for (let i = 10; i < 15; i++) {
        expect(createCalls[i][0].data.type).toBe(ConversationType.SESSION);
        expect(createCalls[i][0].data.name).toContain('Session');
      }
    });

    it('should add user as member of all created conversations', async () => {
      const mockConvs = Array.from({ length: 5 }, (_, i) => ({ uid: `conv-${i}` }));
      let createIndex = 0;

      mockPrismaService.conversations.create.mockImplementation(() => {
        return Promise.resolve(mockConvs[createIndex++ % 5]);
      });
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 5 });
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await service.createMockConversation('user-456');

      expect(mockPrismaService.conversationMembers.createMany).toHaveBeenCalledTimes(3);

      const createManyCall1 = mockPrismaService.conversationMembers.createMany.mock.calls[0][0];
      expect(createManyCall1.data).toHaveLength(5);
      expect(createManyCall1.data[0].userUid).toBe('user-456');
    });

    it('should log info about created conversations', async () => {
      mockPrismaService.conversations.create.mockResolvedValue({ uid: 'conv-123' });
      mockPrismaService.conversationMembers.createMany.mockResolvedValue({ count: 5 });
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      await service.createMockConversation('user-123');

      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created 15 mock conversations'),
      );
    });
  });

  describe('createMessage', () => {
    const userUid = 'user-123';
    const conversationUid = 'conv-123';
    const content = 'Hello, this is a test message';

    const mockConversation = {
      messages: [],
      name: 'Test Conversation',
      sessionUid: null,
      type: ConversationType.PRIVATE,
      uid: conversationUid,
    };

    beforeEach(() => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        userUid,
      });
    });

    it('should create a text message when type is TEXT', async () => {
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        content,
        conversationUid,
        null,
      );
      expect(mockMessagesService.createMediaMessage).not.toHaveBeenCalled();
    });

    it('should create a media message when type is IMAGE', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
      };
      mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.IMAGE, mockFile);

      expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
        userUid,
        conversationUid,
        MessageType.IMAGE,
        mockFile,
        null,
      );
      expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
    });

    it('should create a media message when type is VIDEO', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-video-data'),
        originalname: 'test-video.mp4',
      };
      mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.VIDEO, mockFile);

      expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
        userUid,
        conversationUid,
        MessageType.VIDEO,
        mockFile,
        null,
      );
    });

    it('should pass sessionUid when conversation has a session', async () => {
      const sessionUid = 'session-456';
      const conversationWithSession = {
        ...mockConversation,
        sessionUid,
      };
      mockPrismaService.conversations.findUnique.mockResolvedValue(conversationWithSession);
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        content,
        conversationUid,
        sessionUid,
      );
    });

    it('should verify user is a member before creating message', async () => {
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
        where: {
          uid: conversationUid,
        },
      });
      expect(mockPrismaService.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid,
          userUid,
        },
      });
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(ForbiddenException);
      expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(null);

      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(NotFoundException);
      expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
    });
  });
});

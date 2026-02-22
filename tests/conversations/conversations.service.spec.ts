import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessagesService } from 'src/conversations/services/messages.service';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let mockPrisma: any;
  let mockLogger: any;
  let mockMessagesService: any;
  let mockConversationMembersService: any;

  beforeEach(async () => {
    mockPrisma = {
      conversationMembers: {
        createMany: jest.fn(),
        findFirst: jest.fn(),
      },
      conversations: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      setContext: jest.fn(),
    };

    mockMessagesService = {
      createMediaMessage: jest.fn(),
      createTextMessage: jest.fn(),
      getMessages: jest.fn(),
    };

    mockConversationMembersService = {
      create: jest.fn(),
      createMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: ConversationMembersService,
          useValue: mockConversationMembersService,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSessionConversation', () => {
    it('should create a session conversation successfully', async () => {
      const createDto = {
        name: 'Session 123',
        sessionUid: 'session-123',
        type: ConversationType.SESSION,
        userUid: 'user-1',
      };

      const mockConversation = {
        createdAt: new Date(),
        imageUrl: null,
        name: createDto.name,
        sessionUid: createDto.sessionUid,
        type: createDto.type,
        uid: 'conv-123',
        updatedAt: new Date(),
      };

      mockPrisma.conversations.create.mockResolvedValue(mockConversation);
      mockConversationMembersService.create.mockResolvedValue(undefined);

      await service.createSessionConversation(createDto);

      expect(mockPrisma.conversations.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          sessionUid: createDto.sessionUid,
          type: createDto.type,
        },
      });
      expect(mockConversationMembersService.create).toHaveBeenCalledWith(
        'conv-123',
        'user-1',
        undefined,
      );
    });

    it('should throw BadRequestException when sessionUid is missing', async () => {
      const createDto = {
        name: 'Session',
        sessionUid: undefined,
        type: ConversationType.SESSION,
        userUid: 'user-1',
      } as any;

      await expect(service.createSessionConversation(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.conversations.create).not.toHaveBeenCalled();
    });

    it('should work with a transaction client', async () => {
      const createDto = {
        name: 'Session TX',
        sessionUid: 'session-tx-123',
        type: ConversationType.SESSION,
        userUid: 'user-1',
      };

      const mockConversation = {
        uid: 'conv-tx-123',
      };

      const mockTx = {
        conversations: {
          create: jest.fn().mockResolvedValue(mockConversation),
        },
      } as any;

      mockConversationMembersService.create.mockResolvedValue(undefined);

      await service.createSessionConversation(createDto, mockTx);

      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockConversationMembersService.create).toHaveBeenCalledWith(
        'conv-tx-123',
        'user-1',
        mockTx,
      );
      expect(mockPrisma.conversations.create).not.toHaveBeenCalled();
    });
  });

  describe('createPrivateConversation', () => {
    it('should create a private conversation successfully', async () => {
      const createDto = {
        type: ConversationType.PRIVATE,
        userUids: ['user-1', 'user-2'],
      };

      const mockConversation = {
        createdAt: new Date(),
        imageUrl: null,
        name: null,
        sessionUid: null,
        type: createDto.type,
        uid: 'conv-private-123',
        updatedAt: new Date(),
      };

      mockPrisma.conversations.create.mockResolvedValue(mockConversation);
      mockConversationMembersService.createMany.mockResolvedValue(undefined);

      const result = await service.createPrivateConversation(createDto);

      expect(result).toEqual({ uid: 'conv-private-123' });
      expect(mockPrisma.conversations.create).toHaveBeenCalledWith({
        data: {
          type: createDto.type,
        },
      });
      expect(mockConversationMembersService.createMany).toHaveBeenCalledWith(
        'conv-private-123',
        ['user-1', 'user-2'],
        undefined,
      );
    });

    it('should work with a transaction client', async () => {
      const createDto = {
        type: ConversationType.PRIVATE,
        userUids: ['user-1', 'user-2'],
      };

      const mockConversation = {
        uid: 'conv-tx-private-123',
      };

      const mockTx = {
        conversations: {
          create: jest.fn().mockResolvedValue(mockConversation),
        },
      } as any;

      mockConversationMembersService.createMany.mockResolvedValue(undefined);

      const result = await service.createPrivateConversation(createDto, mockTx);

      expect(result).toEqual({ uid: 'conv-tx-private-123' });
      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockConversationMembersService.createMany).toHaveBeenCalledWith(
        'conv-tx-private-123',
        ['user-1', 'user-2'],
        mockTx,
      );
      expect(mockPrisma.conversations.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllByUserUid', () => {
    it('should return paginated conversations', async () => {
      const userUid = 'user-123';
      const filters = {};

      const mockConversations = [
        {
          _count: { messages: 3 },
          conversationMembers: [],
          createdAt: new Date(),
          imageUrl: null,
          messages: [
            {
              content: 'Last message',
              createdAt: new Date(),
              globalStatus: MessageStatus.SENT,
              sender: {
                firstname: 'John',
                imageUrl: null,
                lastname: 'Doe',
                uid: 'user-2',
              },
              senderUid: 'user-2',
              type: MessageType.TEXT,
              uid: 'msg-1',
              updatedAt: new Date(),
            },
          ],
          name: 'Test Conversation',
          session: null,
          sessionUid: null,
          type: ConversationType.PRIVATE,
          uid: 'conv-1',
          updatedAt: new Date(),
        },
      ];

      mockPrisma.conversations.findMany.mockResolvedValue(mockConversations);

      const result = await service.findAllByUserUid(filters, userUid);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.nextCursor).toBeNull();
      expect(mockPrisma.conversations.findMany).toHaveBeenCalled();
    });

    it('should apply type and limit filters correctly', async () => {
      const userUid = 'user-123';
      const filters = {
        limit: 5,
        type: ConversationType.GROUP,
      };

      mockPrisma.conversations.findMany.mockResolvedValue([]);

      await service.findAllByUserUid(filters, userUid);

      const callArgs = mockPrisma.conversations.findMany.mock.calls[0][0];
      expect(callArgs.where.type).toBe(ConversationType.GROUP);
      expect(callArgs.take).toBe(6); // limit + 1 for cursor pagination
    });

    it('should filter by name on conversation.name when type is SESSION or GROUP', async () => {
      const userUid = 'user-123';
      const filters = {
        name: 'Session Name',
        type: ConversationType.SESSION,
      };

      mockPrisma.conversations.findMany.mockResolvedValue([]);

      await service.findAllByUserUid(filters, userUid);

      const callArgs = mockPrisma.conversations.findMany.mock.calls[0][0];
      expect(callArgs.where.type).toBe(ConversationType.SESSION);
      expect(callArgs.where.name).toEqual({
        contains: 'Session Name',
        mode: 'insensitive',
      });
      expect(callArgs.where.AND).toBeUndefined();
      expect(callArgs.where.OR).toBeUndefined();
    });

    it('should filter by name on other user firstname/lastname when type is PRIVATE', async () => {
      const userUid = 'user-123';
      const filters = {
        name: 'Dupont',
        type: ConversationType.PRIVATE,
      };

      mockPrisma.conversations.findMany.mockResolvedValue([]);

      await service.findAllByUserUid(filters, userUid);

      const callArgs = mockPrisma.conversations.findMany.mock.calls[0][0];
      expect(callArgs.where.type).toBe(ConversationType.PRIVATE);
      expect(callArgs.where.name).toBeUndefined();
      expect(callArgs.where.AND).toBeDefined();
      expect(callArgs.where.AND).toHaveLength(1);
      expect(callArgs.where.AND[0].conversationMembers.some.userUid).toEqual({
        not: userUid,
      });
      expect(callArgs.where.AND[0].conversationMembers.some.user.OR).toEqual([
        { firstname: { contains: 'Dupont', mode: 'insensitive' } },
        { lastname: { contains: 'Dupont', mode: 'insensitive' } },
      ]);
    });

    it('should filter by name with OR (SESSION/GROUP by name, PRIVATE by other user) when no type', async () => {
      const userUid = 'user-123';
      const filters = {
        name: 'Search',
      };

      mockPrisma.conversations.findMany.mockResolvedValue([]);

      await service.findAllByUserUid(filters, userUid);

      const callArgs = mockPrisma.conversations.findMany.mock.calls[0][0];
      expect(callArgs.where.type).toBeUndefined();
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(3);
      expect(callArgs.where.OR[0]).toEqual({
        name: { contains: 'Search', mode: 'insensitive' },
        type: ConversationType.SESSION,
      });
      expect(callArgs.where.OR[1]).toEqual({
        name: { contains: 'Search', mode: 'insensitive' },
        type: ConversationType.GROUP,
      });
      expect(callArgs.where.OR[2].type).toBe(ConversationType.PRIVATE);
      expect(callArgs.where.OR[2].conversationMembers.some.userUid).toEqual({
        not: userUid,
      });
      expect(callArgs.where.OR[2].conversationMembers.some.user.OR).toEqual([
        { firstname: { contains: 'Search', mode: 'insensitive' } },
        { lastname: { contains: 'Search', mode: 'insensitive' } },
      ]);
    });

    it('should handle cursor pagination', async () => {
      const userUid = 'user-123';
      const filters = {
        cursor: 'conv-cursor-123',
        limit: 10,
      };

      mockPrisma.conversations.findMany.mockResolvedValue([]);

      await service.findAllByUserUid(filters, userUid);

      const callArgs = mockPrisma.conversations.findMany.mock.calls[0][0];
      expect(callArgs.cursor).toEqual({ uid: 'conv-cursor-123' });
      expect(callArgs.skip).toBe(1);
    });

    it('should return nextCursor when more items available', async () => {
      const userUid = 'user-123';
      const filters = { limit: 2 };

      const mockConversations = [
        {
          _count: { messages: 0 },
          conversationMembers: [],
          messages: [],
          name: 'Conv 1',
          session: null,
          type: ConversationType.PRIVATE,
          uid: 'conv-1',
        },
        {
          _count: { messages: 0 },
          conversationMembers: [],
          messages: [],
          name: 'Conv 2',
          session: null,
          type: ConversationType.PRIVATE,
          uid: 'conv-2',
        },
        {
          _count: { messages: 0 },
          conversationMembers: [],
          messages: [],
          name: 'Conv 3',
          session: null,
          type: ConversationType.PRIVATE,
          uid: 'conv-3',
        },
      ];

      mockPrisma.conversations.findMany.mockResolvedValue(mockConversations);

      const result = await service.findAllByUserUid(filters, userUid);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('conv-3');
    });
  });

  describe('findOne', () => {
    it('should return a conversation by uid', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      const mockConversation = {
        conversationMembers: [
          {
            user: {
              firstname: 'Jane',
              imageUrl: null,
              lastname: 'Smith',
              uid: 'user-2',
            },
          },
        ],
        createdAt: new Date(),
        imageUrl: null,
        messages: [
          {
            content: 'Hello',
            createdAt: new Date(),
            globalStatus: MessageStatus.SENT,
            sender: {
              firstname: 'Jane',
              imageUrl: null,
              lastname: 'Smith',
              uid: 'user-2',
            },
            senderUid: 'user-2',
            type: MessageType.TEXT,
            uid: 'msg-1',
            updatedAt: new Date(),
          },
        ],
        name: null,
        sessionUid: null,
        type: ConversationType.PRIVATE,
        uid: conversationUid,
        updatedAt: new Date(),
      };

      mockPrisma.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-1',
        userUid,
      });

      const result = await service.findOne(conversationUid, userUid);

      expect(result).toBeDefined();
      expect(mockPrisma.conversations.findUnique).toHaveBeenCalledWith({
        include: expect.any(Object),
        where: { uid: conversationUid },
      });
      expect(mockPrisma.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid,
          userUid,
        },
      });
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      const conversationUid = 'non-existent';
      const userUid = 'user-123';

      mockPrisma.conversations.findUnique.mockResolvedValue(null);

      await expect(service.findOne(conversationUid, userUid)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-not-member';

      const mockConversation = {
        conversationMembers: [],
        messages: [],
        type: ConversationType.PRIVATE,
        uid: conversationUid,
      };

      mockPrisma.conversations.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.findOne(conversationUid, userUid)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createMessage', () => {
    it('should create a text message in existing conversation', async () => {
      const userUid = 'user-123';
      const dto = {
        content: 'Hello',
        conversationUid: 'conv-123',
        type: MessageType.TEXT,
      };

      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, dto);

      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        'Hello',
        'conv-123',
        null,
      );
    });

    it('should create a media message with file', async () => {
      const userUid = 'user-123';
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.IMAGE,
      };
      const file = {
        buffer: Buffer.from('image-data'),
        originalname: 'test.jpg',
      };

      mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, dto, file);

      expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
        userUid,
        'conv-123',
        MessageType.IMAGE,
        file,
        null,
      );
    });

    it('should create message in session conversation', async () => {
      const userUid = 'user-123';
      const dto = {
        content: 'Session message',
        sessionUid: 'session-456',
        type: MessageType.TEXT,
      };

      const mockSessionConversation = {
        sessionUid: 'session-456',
        type: ConversationType.SESSION,
        uid: 'conv-session-123',
      };

      mockPrisma.conversations.findUnique.mockResolvedValue(mockSessionConversation);
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, dto);

      expect(mockPrisma.conversations.findUnique).toHaveBeenCalledWith({
        where: {
          sessionUid: 'session-456',
          type: ConversationType.SESSION,
        },
      });
      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        'Session message',
        undefined,
        'conv-session-123',
      );
    });

    it('should throw NotFoundException when session conversation not found', async () => {
      const userUid = 'user-123';
      const dto = {
        content: 'Session message',
        sessionUid: 'non-existent-session',
        type: MessageType.TEXT,
      };

      mockPrisma.conversations.findUnique.mockResolvedValue(null);

      await expect(service.createMessage(userUid, dto)).rejects.toThrow(NotFoundException);
    });

    it('should create private conversation if it does not exist', async () => {
      const userUid = 'user-123';
      const dto = {
        content: 'Private message',
        recipientUid: 'user-456',
        type: MessageType.TEXT,
      };

      mockPrisma.conversations.findFirst.mockResolvedValue(null);
      mockPrisma.conversations.create.mockResolvedValue({ uid: 'conv-new-123' });
      mockConversationMembersService.createMany.mockResolvedValue(undefined);
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, dto);

      expect(mockPrisma.conversations.create).toHaveBeenCalled();
      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        'Private message',
        'conv-new-123',
        null,
      );
    });

    it('should use existing private conversation if it exists', async () => {
      const userUid = 'user-123';
      const dto = {
        content: 'Private message',
        recipientUid: 'user-456',
        type: MessageType.TEXT,
      };

      const mockPrivateConversation = {
        type: ConversationType.PRIVATE,
        uid: 'conv-existing-123',
      };

      mockPrisma.conversations.findFirst.mockResolvedValue(mockPrivateConversation);
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, dto);

      expect(mockPrisma.conversations.create).not.toHaveBeenCalled();
      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        'Private message',
        'conv-existing-123',
        null,
      );
    });
  });

  describe('loadMoreMessages', () => {
    it('should load more messages when user is a member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';
      const cursor = 'msg-cursor-123';
      const limit = 20;

      const mockMessages = {
        items: [
          {
            content: 'Message 1',
            createdAt: new Date(),
            globalStatus: MessageStatus.SENT,
            hasAnyRead: false,
            hasEveryoneRead: false,
            type: MessageType.TEXT,
            uid: 'msg-1',
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-1',
        userUid,
      });
      mockMessagesService.getMessages.mockResolvedValue(mockMessages);

      const result = await service.loadMoreMessages(conversationUid, userUid, cursor, limit);

      expect(mockPrisma.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid,
          userUid,
        },
      });
      expect(mockMessagesService.getMessages).toHaveBeenCalledWith(
        conversationUid,
        userUid,
        cursor,
        limit,
      );
      expect(result).toEqual(mockMessages);
    });

    it('should throw error when user is not a member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-not-member';

      mockPrisma.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.loadMoreMessages(conversationUid, userUid)).rejects.toThrow(
        `User ${userUid} is not a member of conversation ${conversationUid}`,
      );
      expect(mockMessagesService.getMessages).not.toHaveBeenCalled();
    });

    it('should use default limit when not specified', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-1',
        userUid,
      });
      mockMessagesService.getMessages.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await service.loadMoreMessages(conversationUid, userUid);

      expect(mockMessagesService.getMessages).toHaveBeenCalledWith(
        conversationUid,
        userUid,
        undefined,
        50,
      );
    });
  });

  describe('findByUserUids', () => {
    it('should return existing private conversation between two users', async () => {
      const connectedUserUid = 'user-123';
      const otherUserUid = 'user-456';

      const mockConversation = {
        uid: 'conv-private-123',
      };

      mockPrisma.conversations.findFirst.mockResolvedValue(mockConversation);

      const result = await service.findByUserUids(connectedUserUid, otherUserUid);

      expect(result).toEqual({ conversationUid: 'conv-private-123' });
      expect(mockPrisma.conversations.findFirst).toHaveBeenCalledWith({
        select: {
          uid: true,
        },
        where: {
          AND: [
            {
              conversationMembers: {
                some: { userUid: connectedUserUid },
              },
            },
            {
              conversationMembers: {
                some: { userUid: otherUserUid },
              },
            },
          ],
          type: ConversationType.PRIVATE,
        },
      });
    });

    it('should return null conversationUid when no conversation exists', async () => {
      const connectedUserUid = 'user-123';
      const otherUserUid = 'user-999';

      mockPrisma.conversations.findFirst.mockResolvedValue(null);

      const result = await service.findByUserUids(connectedUserUid, otherUserUid);

      expect(result).toEqual({ conversationUid: null });
      expect(mockPrisma.conversations.findFirst).toHaveBeenCalledWith({
        select: {
          uid: true,
        },
        where: {
          AND: [
            {
              conversationMembers: {
                some: { userUid: connectedUserUid },
              },
            },
            {
              conversationMembers: {
                some: { userUid: otherUserUid },
              },
            },
          ],
          type: ConversationType.PRIVATE,
        },
      });
    });

    it('should only search for private conversations', async () => {
      const connectedUserUid = 'user-123';
      const otherUserUid = 'user-456';

      mockPrisma.conversations.findFirst.mockResolvedValue(null);

      await service.findByUserUids(connectedUserUid, otherUserUid);

      const callArgs = mockPrisma.conversations.findFirst.mock.calls[0][0];
      expect(callArgs.where.type).toBe(ConversationType.PRIVATE);
    });

    it('should ensure both users are members of the conversation', async () => {
      const connectedUserUid = 'user-aaa';
      const otherUserUid = 'user-bbb';

      mockPrisma.conversations.findFirst.mockResolvedValue(null);

      await service.findByUserUids(connectedUserUid, otherUserUid);

      const callArgs = mockPrisma.conversations.findFirst.mock.calls[0][0];
      expect(callArgs.where.AND).toHaveLength(2);
      expect(callArgs.where.AND[0].conversationMembers.some.userUid).toBe(connectedUserUid);
      expect(callArgs.where.AND[1].conversationMembers.some.userUid).toBe(otherUserUid);
    });
  });
});

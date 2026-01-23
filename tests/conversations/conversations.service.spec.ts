import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from 'src/conversations/conversations.service';
import { MessagesService } from 'src/conversations/messages.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';
import {
  ConversationMapper,
  RawConversationCollectionItem,
} from 'src/conversations/mappers/conversation.mapper';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let mockPrismaService: any;
  let mockMessagesService: any;
  let mockStorageService: any;

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

    mockStorageService = {
      getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/image.jpg'),
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
        {
          provide: StorageService,
          useValue: mockStorageService,
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
        conversationMembers: [
          {
            user: {
              firstname: 'John',
              imageUrl: 'user1.jpg',
              lastname: 'Doe',
              uid: 'user-2',
            },
          },
        ],
        lastMessageAt: new Date(),
        messages: [
          {
            content: 'Last message',
            createdAt: new Date(),
            sender: {
              firstname: 'John',
              imageUrl: 'user1.jpg',
              lastname: 'Doe',
              uid: 'user-2',
            },
            senderUid: 'user-2',
            uid: 'msg-1',
            updatedAt: new Date(),
          },
        ],
        name: 'Group 1',
        type: ConversationType.GROUP,
        uid: 'conv-1',
      },
      {
        conversationMembers: [
          {
            user: {
              firstname: 'Jane',
              imageUrl: 'user3.jpg',
              lastname: 'Smith',
              uid: 'user-3',
            },
          },
        ],
        lastMessageAt: new Date(),
        messages: [
          {
            content: 'Another message',
            createdAt: new Date(),
            sender: {
              firstname: 'Jane',
              imageUrl: 'user3.jpg',
              lastname: 'Smith',
              uid: 'user-3',
            },
            senderUid: 'user-3',
            uid: 'msg-2',
            updatedAt: new Date(),
          },
        ],
        name: 'Group 2',
        type: ConversationType.GROUP,
        uid: 'conv-2',
      },
    ];

    beforeEach(() => {
      jest
        .spyOn(ConversationMapper, 'toCollectionDto')
        .mockImplementation(async (conversation: RawConversationCollectionItem) => {
          const user = conversation.conversationMembers?.[0]?.user;
          const message = conversation.messages?.[0];
          return {
            imageUrl: user?.imageUrl ? 'https://signed-url.example.com/' + user.imageUrl : null,
            lastMessage: message
              ? {
                  content: message.content,
                  createdAt: message.createdAt,
                  uid: message.uid,
                }
              : null,
            lastMessageAt: conversation.lastMessageAt,
            name: conversation.name || (user ? `${user.firstname} ${user.lastname}` : ''),
            sender: message?.sender || null,
            sessionUid: conversation.sessionUid || null,
            type: conversation.type,
            uid: conversation.uid,
          } as any;
        });
    });

    it('should return paginated conversations with default limit', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);

      const result = await service.findAllByUserUid({}, 'user-123');

      expect(result.items).toHaveLength(2);
      expect(result.items[0].uid).toBe('conv-1');
      expect(result.items[0].name).toBe('Group 1');
      expect(result.items[1].uid).toBe('conv-2');
      expect(result.items[1].name).toBe('Group 2');
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
      expect(ConversationMapper.toCollectionDto).toHaveBeenCalledTimes(2);
      expect(ConversationMapper.toCollectionDto).toHaveBeenCalledWith(
        mockConversations[0],
        mockStorageService,
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
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 1',
          type: ConversationType.PRIVATE,
          uid: 'conv-1',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 2',
          type: ConversationType.PRIVATE,
          uid: 'conv-2',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 3',
          type: ConversationType.PRIVATE,
          uid: 'conv-3',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 4',
          type: ConversationType.PRIVATE,
          uid: 'conv-4',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 5',
          type: ConversationType.PRIVATE,
          uid: 'conv-5',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messages: [],
          name: 'Conv 6',
          type: ConversationType.PRIVATE,
          uid: 'conv-6',
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.conversations.findMany.mockResolvedValue(manyConversations);
      jest
        .spyOn(ConversationMapper, 'toCollectionDto')
        .mockImplementationOnce(
          async (conversation: RawConversationCollectionItem, storageService: StorageService) => {
            return {
              imageUrl: null,
              lastMessage: null,
              lastMessageAt: conversation.lastMessageAt,
              name: `Conv ${conversation.uid}`,
              sender: null,
              sessionUid: null,
              type: ConversationType.PRIVATE,
              uid: conversation.uid,
            };
          },
        );

      const result = await service.findAllByUserUid({ limit: 5 }, 'user-123');

      expect(result.items).toHaveLength(5);
      expect(result.nextCursor).toBe('conv-6');
    });

    it('should include last message, conversationMembers, and session in conversations', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);

      await service.findAllByUserUid({}, 'user-123');

      expect(mockPrismaService.conversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            conversationMembers: expect.objectContaining({
              select: expect.objectContaining({
                user: expect.objectContaining({
                  select: expect.objectContaining({
                    uid: true,
                    firstname: true,
                    lastname: true,
                    imageUrl: true,
                  }),
                }),
              }),
              where: expect.objectContaining({
                NOT: {
                  userUid: 'user-123',
                },
              }),
            }),
            messages: expect.objectContaining({
              orderBy: {
                createdAt: 'desc',
              },
              select: expect.objectContaining({
                content: true,
                createdAt: true,
                uid: true,
                senderUid: true,
                updatedAt: true,
                sender: expect.any(Object),
              }),
              take: 1,
            }),
            session: expect.objectContaining({
              select: expect.objectContaining({
                sessionImages: expect.any(Object),
              }),
            }),
          }),
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
    const mockRawConversation = {
      conversationMembers: [
        {
          user: {
            firstname: 'John',
            imageUrl: 'user2.jpg',
            lastname: 'Doe',
            uid: 'user-2',
          },
        },
      ],
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messages: [
        {
          content: 'Message 1',
          createdAt: new Date(),
          globalStatus: MessageStatus.SENT,
          sender: {
            firstname: 'Jane',
            imageUrl: 'user1.jpg',
            lastname: 'Smith',
            uid: 'user-1',
          },
          type: MessageType.TEXT,
          uid: 'msg-1',
          updatedAt: new Date(),
        },
        {
          content: 'Message 2',
          createdAt: new Date(),
          globalStatus: MessageStatus.SENT,
          sender: {
            firstname: 'John',
            imageUrl: 'user2.jpg',
            lastname: 'Doe',
            uid: 'user-2',
          },
          type: MessageType.TEXT,
          uid: 'msg-2',
          updatedAt: new Date(),
        },
      ],
      name: 'Test Conversation',
      sessionUid: null,
      type: ConversationType.PRIVATE,
      uid: 'conv-123',
      updatedAt: new Date(),
    };

    const mockMappedConversation = {
      imageUrl: null,
      lastMessageAt: mockRawConversation.lastMessageAt,
      messages: [
        {
          content: 'Message 1',
          createdAt: mockRawConversation.messages[0].createdAt,
          globalStatus: MessageStatus.SENT,
          type: MessageType.TEXT,
          uid: 'msg-1',
        },
        {
          content: 'Message 2',
          createdAt: mockRawConversation.messages[1].createdAt,
          globalStatus: MessageStatus.SENT,
          type: MessageType.TEXT,
          uid: 'msg-2',
        },
      ],
      name: 'John Doe',
      sender: mockRawConversation.conversationMembers[0].user,
      sessionUid: null,
      type: ConversationType.PRIVATE,
      uid: 'conv-123',
    };

    beforeEach(() => {
      jest.spyOn(ConversationMapper, 'toFindOneDto').mockReturnValue(mockMappedConversation);
    });

    it('should return a mapped conversation if user is a member', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid: 'conv-123',
        userUid: 'user-123',
      });

      const result = await service.findOne('conv-123', 'user-123');

      expect(result).toEqual(mockMappedConversation);
      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
        include: {
          conversationMembers: {
            select: {
              user: {
                select: {
                  firstname: true,
                  imageUrl: true,
                  lastname: true,
                  uid: true,
                },
              },
            },
            where: {
              NOT: {
                userUid: 'user-123',
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              content: true,
              createdAt: true,
              globalStatus: true,
              sender: {
                select: {
                  firstname: true,
                  imageUrl: true,
                  lastname: true,
                  uid: true,
                },
              },
              senderUid: true,
              type: true,
              uid: true,
              updatedAt: true,
            },
            take: 10,
          },
        },
        where: {
          uid: 'conv-123',
        },
      });
      expect(ConversationMapper.toFindOneDto).toHaveBeenCalledWith(mockRawConversation);
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(null);

      await expect(service.findOne('conv-123', 'user-123')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('conv-123', 'user-123')).rejects.toThrow(
        'Conversation with uid conv-123 not found',
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.findOne('conv-123', 'unauthorized-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('conv-123', 'unauthorized-user')).rejects.toThrow(
        'User with uid unauthorized-user is not a member of this conversation',
      );
    });

    it('should include up to 10 most recent messages with detailed select', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({ userUid: 'user-123' });

      await service.findOne('conv-123', 'user-123');

      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            messages: expect.objectContaining({
              select: expect.objectContaining({
                content: true,
                createdAt: true,
                globalStatus: true,
                sender: expect.any(Object),
                senderUid: true,
                type: true,
                uid: true,
                updatedAt: true,
              }),
              take: 10,
            }),
          }),
        }),
      );
    });

    it('should exclude current user from conversationMembers', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({ userUid: 'user-456' });

      await service.findOne('conv-789', 'user-456');

      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            conversationMembers: expect.objectContaining({
              where: {
                NOT: {
                  userUid: 'user-456',
                },
              },
            }),
          }),
        }),
      );
    });

    it('should check membership for the correct user and conversation', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
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

  describe('createMessage', () => {
    const userUid = 'user-123';
    const conversationUid = 'conv-123';
    const content = 'Hello, this is a test message';

    const mockMappedConversation = {
      imageUrl: null,
      lastMessageAt: new Date(),
      messages: [],
      name: 'Test Conversation',
      sender: null,
      sessionUid: null,
      type: ConversationType.PRIVATE,
      uid: conversationUid,
    };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockMappedConversation);
    });

    it('should create a text message when type is TEXT', async () => {
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(service.findOne).toHaveBeenCalledWith(conversationUid, userUid);
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

      expect(service.findOne).toHaveBeenCalledWith(conversationUid, userUid);
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

      expect(service.findOne).toHaveBeenCalledWith(conversationUid, userUid);
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
        ...mockMappedConversation,
        sessionUid,
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(conversationWithSession);
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(service.findOne).toHaveBeenCalledWith(conversationUid, userUid);
      expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
        userUid,
        content,
        conversationUid,
        sessionUid,
      );
    });

    it('should verify user is a member before creating message via findOne', async () => {
      mockMessagesService.createTextMessage.mockResolvedValue(undefined);

      await service.createMessage(userUid, content, conversationUid, MessageType.TEXT);

      expect(service.findOne).toHaveBeenCalledWith(conversationUid, userUid);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new ForbiddenException(`User with uid ${userUid} is not a member of this conversation`),
        );

      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(`User with uid ${userUid} is not a member of this conversation`);
      expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(
          new NotFoundException(`Conversation with uid ${conversationUid} not found`),
        );

      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createMessage(userUid, content, conversationUid, MessageType.TEXT),
      ).rejects.toThrow(`Conversation with uid ${conversationUid} not found`);
      expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
    });
  });
});

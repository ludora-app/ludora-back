import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { MessagesService } from 'src/conversations/services/messages.service';
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
  let mockConversationMembersService: any;

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
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    mockMessagesService = {
      createTextMessage: jest.fn(),
      createMediaMessage: jest.fn(),
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

  describe('createSessionConversation', () => {
    const createSessionConversationDto = {
      name: 'Test Session',
      sessionUid: 'session-123',
      type: ConversationType.SESSION,
      userUid: 'user-1',
    };

    it('should create a session conversation without transaction', async () => {
      const mockConversation = {
        name: 'Test Session',
        sessionUid: 'session-123',
        type: ConversationType.SESSION,
        uid: 'conv-123',
      };

      mockPrismaService.conversations.create.mockResolvedValue(mockConversation);
      mockConversationMembersService.create.mockResolvedValue(undefined);

      await service.createSessionConversation(createSessionConversationDto);

      expect(mockPrismaService.conversations.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Session',
          sessionUid: 'session-123',
          type: ConversationType.SESSION,
        },
      });

      expect(mockConversationMembersService.create).toHaveBeenCalledWith(
        'conv-123',
        'user-1',
        undefined,
      );

      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should create a session conversation with transaction', async () => {
      const mockTx = {
        conversations: {
          create: jest.fn().mockResolvedValue({ uid: 'conv-456' }),
        },
      };

      mockConversationMembersService.create.mockResolvedValue(undefined);

      await service.createSessionConversation(createSessionConversationDto, mockTx as any);

      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockConversationMembersService.create).toHaveBeenCalledWith(
        'conv-456',
        'user-1',
        mockTx,
      );
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

    it('should call conversationMembersService.create with conversation uid and user uid', async () => {
      const mockConversation = { uid: 'conv-789' };
      mockPrismaService.conversations.create.mockResolvedValue(mockConversation);
      mockConversationMembersService.create.mockResolvedValue(undefined);

      const dto = {
        ...createSessionConversationDto,
        userUid: 'user-789',
      };

      await service.createSessionConversation(dto);

      expect(mockConversationMembersService.create).toHaveBeenCalledWith(
        'conv-789',
        'user-789',
        undefined,
      );
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
      mockConversationMembersService.createMany.mockResolvedValue(undefined);

      await service.createPrivateConversation(createPrivateConversationDto);

      expect(mockPrismaService.conversations.create).toHaveBeenCalledWith({
        data: {
          type: ConversationType.PRIVATE,
        },
      });

      expect(mockConversationMembersService.createMany).toHaveBeenCalledWith(
        'conv-private-123',
        ['user-1', 'user-2'],
        undefined,
      );
    });

    it('should create a private conversation with transaction', async () => {
      const mockTx = {
        conversations: {
          create: jest.fn().mockResolvedValue({ uid: 'conv-private-456' }),
        },
      };

      mockConversationMembersService.createMany.mockResolvedValue(undefined);

      await service.createPrivateConversation(createPrivateConversationDto, mockTx as any);

      expect(mockTx.conversations.create).toHaveBeenCalled();
      expect(mockConversationMembersService.createMany).toHaveBeenCalledWith(
        'conv-private-456',
        ['user-1', 'user-2'],
        mockTx,
      );
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

    it('should return paginated conversations with default limit', async () => {
      mockPrismaService.conversations.findMany.mockResolvedValue(mockConversations);
      const toCollectionDtoSpy = jest.spyOn(ConversationMapper, 'toCollectionDto');

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
                isArchived: false,
                isVisible: true,
                userUid: 'user-123',
              },
            },
          }),
        }),
      );
      expect(toCollectionDtoSpy).toHaveBeenCalledTimes(2);
      expect(toCollectionDtoSpy).toHaveBeenCalledWith(mockConversations[0], 'user-123');
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
          messages: [],
          name: 'Conv 1',
          type: ConversationType.PRIVATE,
          uid: 'conv-1',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          messages: [],
          name: 'Conv 2',
          type: ConversationType.PRIVATE,
          uid: 'conv-2',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          messages: [],
          name: 'Conv 3',
          type: ConversationType.PRIVATE,
          uid: 'conv-3',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          messages: [],
          name: 'Conv 4',
          type: ConversationType.PRIVATE,
          uid: 'conv-4',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
          messages: [],
          name: 'Conv 5',
          type: ConversationType.PRIVATE,
          uid: 'conv-5',
          updatedAt: new Date(),
        },
        {
          conversationMembers: [],
          createdAt: new Date(),
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
        .mockImplementationOnce((conversation: RawConversationCollectionItem) => ({
          imageUrl: null,
          lastMessage: null,
          name: `Conv ${conversation.uid}`,
          receiver: null,
          sender: null,
          sessionData: null,
          type: ConversationType.PRIVATE,
          uid: conversation.uid,
          unreadMessagesCount: 0,
        }));

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
      messages: [
        {
          content: 'Message 1',
          createdAt: mockRawConversation.messages[0].createdAt,
          globalStatus: MessageStatus.SENT,
          isSender: false,
          type: MessageType.TEXT,
          uid: 'msg-1',
        },
        {
          content: 'Message 2',
          createdAt: mockRawConversation.messages[1].createdAt,
          globalStatus: MessageStatus.SENT,
          isSender: true,
          type: MessageType.TEXT,
          uid: 'msg-2',
        },
      ],
      name: 'John Doe',
      receiver: null,
      sender: mockRawConversation.conversationMembers[0].user,
      sessionData: null,
      settings: { isArchived: false, isMuted: false },
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
              isArchived: true,
              isMuted: true,
              userUid: true,
              user: {
                select: {
                  firstname: true,
                  imageUrl: true,
                  lastname: true,
                  uid: true,
                },
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
              messageReceipts: {
                select: {
                  status: true,
                  userUid: true,
                },
              },
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
          session: {
            select: {
              sessionImages: {
                select: {
                  url: true,
                },
              },
              sessionTeams: {
                select: {
                  teamLabel: true,
                  teamName: true,
                },
                where: {
                  sessionPlayers: {
                    some: {
                      userUid: 'user-123',
                    },
                  },
                },
              },
              sport: true,
            },
          },
        },
        where: {
          uid: 'conv-123',
        },
      });
      expect(ConversationMapper.toFindOneDto).toHaveBeenCalledWith(mockRawConversation, 'user-123');
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

    it('should fetch all conversationMembers and pass userUid to mapper for separation', async () => {
      mockPrismaService.conversations.findUnique.mockResolvedValue(mockRawConversation);
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({ userUid: 'user-456' });

      await service.findOne('conv-789', 'user-456');

      expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            conversationMembers: expect.objectContaining({
              select: expect.objectContaining({
                isArchived: true,
                isMuted: true,
                userUid: true,
                user: expect.any(Object),
              }),
            }),
          }),
        }),
      );
      expect(ConversationMapper.toFindOneDto).toHaveBeenCalledWith(mockRawConversation, 'user-456');
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

    describe('Session Conversation Messages', () => {
      it('should create a text message in a session conversation', async () => {
        const sessionUid = 'session-456';
        const dto = {
          content,
          sessionUid,
          type: MessageType.TEXT,
        };
        const mockSessionConversation = {
          sessionUid,
          type: ConversationType.SESSION,
          uid: 'session-conv-123',
        };

        mockPrismaService.conversations.findUnique.mockResolvedValue(mockSessionConversation);
        mockMessagesService.createTextMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto);

        expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
          where: {
            sessionUid,
            type: ConversationType.SESSION,
          },
        });
        expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
          userUid,
          content,
          undefined,
          'session-conv-123',
        );
        expect(mockMessagesService.createMediaMessage).not.toHaveBeenCalled();
      });

      it('should create a media message in a session conversation', async () => {
        const sessionUid = 'session-456';
        const mockFile = {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'test-image.jpg',
        };
        const dto = {
          sessionUid,
          type: MessageType.IMAGE,
        };
        const mockSessionConversation = {
          sessionUid,
          type: ConversationType.SESSION,
          uid: 'session-conv-123',
        };

        mockPrismaService.conversations.findUnique.mockResolvedValue(mockSessionConversation);
        mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto, mockFile);

        expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
          where: {
            sessionUid,
            type: ConversationType.SESSION,
          },
        });
        expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
          userUid,
          undefined,
          MessageType.IMAGE,
          mockFile,
          'session-conv-123',
        );
        expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
      });

      it('should throw NotFoundException when session conversation does not exist', async () => {
        const sessionUid = 'session-456';
        const dto = {
          content,
          sessionUid,
          type: MessageType.TEXT,
        };

        mockPrismaService.conversations.findUnique.mockResolvedValue(null);

        await expect(service.createMessage(userUid, dto)).rejects.toThrow(NotFoundException);
        await expect(service.createMessage(userUid, dto)).rejects.toThrow(
          'Session conversation not found',
        );
        expect(mockMessagesService.createTextMessage).not.toHaveBeenCalled();
      });
    });

    describe('Private Conversation Messages', () => {
      it('should create a text message in an existing private conversation', async () => {
        const recipientUid = 'user-456';
        const dto = {
          content,
          recipientUid,
          type: MessageType.TEXT,
        };
        const mockPrivateConversation = {
          type: ConversationType.PRIVATE,
          uid: 'private-conv-123',
        };

        mockPrismaService.conversations.findFirst.mockResolvedValue(mockPrivateConversation);
        mockMessagesService.createTextMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto);

        expect(mockPrismaService.conversations.findFirst).toHaveBeenCalledWith({
          where: {
            AND: [
              {
                conversationMembers: {
                  some: {
                    userUid: userUid,
                  },
                },
              },
              {
                conversationMembers: {
                  some: {
                    userUid: recipientUid,
                  },
                },
              },
            ],
            type: ConversationType.PRIVATE,
          },
        });
        expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
          userUid,
          content,
          'private-conv-123',
          null,
        );
      });

      it('should create a new private conversation if it does not exist', async () => {
        const recipientUid = 'user-456';
        const dto = {
          content,
          recipientUid,
          type: MessageType.TEXT,
        };
        const newPrivateConversation = {
          uid: 'new-private-conv-123',
        };

        mockPrismaService.conversations.findFirst.mockResolvedValue(null);
        jest.spyOn(service, 'createPrivateConversation').mockResolvedValue(newPrivateConversation);
        mockMessagesService.createTextMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto);

        expect(mockPrismaService.conversations.findFirst).toHaveBeenCalled();
        expect(service.createPrivateConversation).toHaveBeenCalledWith({
          type: ConversationType.PRIVATE,
          userUids: [userUid, recipientUid],
        });
        expect(mockMessagesService.createTextMessage).toHaveBeenCalledWith(
          userUid,
          content,
          'new-private-conv-123',
          null,
        );
      });

      it('should create a media message in a new private conversation', async () => {
        const recipientUid = 'user-456';
        const mockFile = {
          buffer: Buffer.from('fake-video-data'),
          originalname: 'test-video.mp4',
        };
        const dto = {
          recipientUid,
          type: MessageType.VIDEO,
        };
        const newPrivateConversation = {
          uid: 'new-private-conv-456',
        };

        mockPrismaService.conversations.findFirst.mockResolvedValue(null);
        jest.spyOn(service, 'createPrivateConversation').mockResolvedValue(newPrivateConversation);
        mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto, mockFile);

        expect(service.createPrivateConversation).toHaveBeenCalledWith({
          type: ConversationType.PRIVATE,
          userUids: [userUid, recipientUid],
        });
        expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
          userUid,
          'new-private-conv-456',
          MessageType.VIDEO,
          mockFile,
          null,
        );
      });
    });

    describe('Regular Conversation Messages', () => {
      it('should create a text message in a regular conversation', async () => {
        const dto = {
          content,
          conversationUid,
          type: MessageType.TEXT,
        };

        mockMessagesService.createTextMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto);

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
        const dto = {
          conversationUid,
          type: MessageType.IMAGE,
        };

        mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto, mockFile);

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
        const dto = {
          conversationUid,
          type: MessageType.VIDEO,
        };

        mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto, mockFile);

        expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
          userUid,
          conversationUid,
          MessageType.VIDEO,
          mockFile,
          null,
        );
      });

      it('should create a media message when type is AUDIO', async () => {
        const mockFile = {
          buffer: Buffer.from('fake-audio-data'),
          originalname: 'test-audio.mp3',
        };
        const dto = {
          conversationUid,
          type: MessageType.AUDIO,
        };

        mockMessagesService.createMediaMessage.mockResolvedValue(undefined);

        await service.createMessage(userUid, dto, mockFile);

        expect(mockMessagesService.createMediaMessage).toHaveBeenCalledWith(
          userUid,
          conversationUid,
          MessageType.AUDIO,
          mockFile,
          null,
        );
      });
    });
  });
});

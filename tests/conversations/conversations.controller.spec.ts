import { Test, TestingModule } from '@nestjs/testing';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { ConversationMembershipGuard } from 'src/conversations/guards/conversation-membership.guard';
import { ConversationsController } from 'src/conversations/conversations.controller';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let mockConversationsService: any;
  let mockMembersService: any;

  beforeEach(async () => {
    mockConversationsService = {
      createMessage: jest.fn(),
      createPrivateConversation: jest.fn(),
      createSessionConversation: jest.fn(),
      findAllByUserUid: jest.fn(),
      findOne: jest.fn(),
      loadMoreMessages: jest.fn(),
    };

    mockMembersService = {
      findAllByConversationUid: jest.fn(),
      updateMuteSettings: jest.fn(),
      updateArchivedSettings: jest.fn(),
      updateDisplayMessagesAfterDeletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
        {
          provide: ConversationMembersService,
          useValue: mockMembersService,
        },
      ],
    })
      .overrideGuard(DevOnlyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ConversationMembershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ConversationsController>(ConversationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByUserUid', () => {
    it('should return paginated conversations for authenticated user', async () => {
      const mockRequest = {
        user: { uid: 'user-123' },
      } as any;

      const mockResponse = {
        items: [
          {
            messages: [{ content: 'Last message', uid: 'msg-1' }],
            name: 'Group 1',
            type: ConversationType.GROUP,
            uid: 'conv-1',
          },
        ],
        nextCursor: null,
        totalCount: 1,
      };

      mockConversationsService.findAllByUserUid.mockResolvedValue(mockResponse);

      const result = await controller.findAllByUserUid({}, mockRequest);

      expect(result).toEqual({
        data: mockResponse,
        message: 'Conversations fetched successfully',
      });
      expect(mockConversationsService.findAllByUserUid).toHaveBeenCalledWith({}, 'user-123');
    });

    it('should pass filters to service', async () => {
      const mockRequest = {
        user: { uid: 'user-456' },
      } as any;

      const filters = {
        limit: 15,
        name: 'Group',
        type: ConversationType.GROUP,
      };

      mockConversationsService.findAllByUserUid.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.findAllByUserUid(filters, mockRequest);

      expect(mockConversationsService.findAllByUserUid).toHaveBeenCalledWith(filters, 'user-456');
    });

    it('should handle cursor pagination', async () => {
      const mockRequest = {
        user: { uid: 'user-789' },
      } as any;

      const filters = {
        cursor: 'conv-cursor-123',
        limit: 10,
      };

      mockConversationsService.findAllByUserUid.mockResolvedValue({
        items: [],
        nextCursor: 'conv-cursor-456',
        totalCount: 0,
      });

      const result = await controller.findAllByUserUid(filters, mockRequest);

      expect(result.data.nextCursor).toBe('conv-cursor-456');
    });
  });

  describe('findOne', () => {
    it('should return a conversation by uid', async () => {
      const mockRequest = {
        user: { uid: 'user-123' },
      } as any;

      const mockConversation = {
        imageUrl: null,
        messages: [
          {
            content: 'Message 1',
            createdAt: new Date(),
            globalStatus: MessageStatus.SENT,
            type: MessageType.TEXT,
            uid: 'msg-1',
          },
        ],
        name: 'John Doe',
        sender: {
          firstname: 'John',
          imageUrl: 'user2.jpg',
          lastname: 'Doe',
          uid: 'user-2',
        },
        sessionUid: null,
        type: ConversationType.PRIVATE,
        uid: 'conv-123',
      };

      mockConversationsService.findOne.mockResolvedValue(mockConversation);

      const result = await controller.findOne('conv-123', mockRequest);

      expect(result).toEqual({
        data: mockConversation,
        message: 'Conversation fetched successfully',
      });
      expect(mockConversationsService.findOne).toHaveBeenCalledWith('conv-123', 'user-123');
    });

    it('should pass user uid from request to service', async () => {
      const mockRequest = {
        user: { uid: 'user-789' },
      } as any;

      const mockConversationResponse = {
        imageUrl: null,
        messages: [],
        name: 'Test Conv',
        sender: null,
        sessionUid: null,
        type: ConversationType.PRIVATE,
        uid: 'conv-456',
      };

      mockConversationsService.findOne.mockResolvedValue(mockConversationResponse);

      await controller.findOne('conv-456', mockRequest);

      expect(mockConversationsService.findOne).toHaveBeenCalledWith('conv-456', 'user-789');
    });
  });

  describe('createMessage', () => {
    const mockRequest = {
      user: { uid: 'user-123' },
    } as any;

    it('should create a text message successfully', async () => {
      const dto = {
        content: 'Hello, this is a test message',
        conversationUid: 'conv-123',
        type: MessageType.TEXT,
      };
      const files: any[] = [];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        undefined,
      );
    });

    it('should create a media message with file', async () => {
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.IMAGE,
      };
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        originalname: 'test-image.jpg',
      };
      const files = [mockFile];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        mockFile,
      );
    });

    it('should handle empty files array for media message', async () => {
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.IMAGE,
      };
      const files: any[] = [];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        undefined,
      );
    });

    it('should extract user uid from request', async () => {
      const differentUserRequest = {
        user: { uid: 'user-456' },
      } as any;
      const dto = {
        content: 'Test message',
        conversationUid: 'conv-123',
        type: MessageType.TEXT,
      };
      const files: any[] = [];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(differentUserRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-456',
        dto,
        undefined,
      );
    });

    it('should handle video message type', async () => {
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.VIDEO,
      };
      const mockFile = {
        buffer: Buffer.from('fake-video-data'),
        mimetype: 'video/mp4',
        originalname: 'test-video.mp4',
      };
      const files = [mockFile];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        mockFile,
      );
    });

    it('should use first file when multiple files are provided', async () => {
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.IMAGE,
      };
      const mockFile1 = {
        buffer: Buffer.from('fake-image-1'),
        originalname: 'image1.jpg',
      };
      const mockFile2 = {
        buffer: Buffer.from('fake-image-2'),
        originalname: 'image2.jpg',
      };
      const files = [mockFile1, mockFile2];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        mockFile1,
      );
    });

    it('should handle session message with sessionUid', async () => {
      const dto = {
        content: 'Session message',
        sessionUid: 'session-456',
        type: MessageType.TEXT,
      };
      const files: any[] = [];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        undefined,
      );
    });

    it('should handle private message with recipientUid', async () => {
      const dto = {
        content: 'Private message',
        recipientUid: 'user-789',
        type: MessageType.TEXT,
      };
      const files: any[] = [];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        undefined,
      );
    });

    it('should handle audio message type', async () => {
      const dto = {
        conversationUid: 'conv-123',
        type: MessageType.AUDIO,
      };
      const mockFile = {
        buffer: Buffer.from('fake-audio-data'),
        mimetype: 'audio/mpeg',
        originalname: 'test-audio.mp3',
      };
      const files = [mockFile];

      mockConversationsService.createMessage.mockResolvedValue(undefined);

      await controller.createMessage(mockRequest, dto, files);

      expect(mockConversationsService.createMessage).toHaveBeenCalledWith(
        'user-123',
        dto,
        mockFile,
      );
    });
  });

  describe('loadMoreMessages', () => {
    it('should return paginated messages for a conversation', async () => {
      const mockRequest = {
        user: { uid: 'user-123' },
      } as any;
      const conversationUid = 'conv-123';

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
          {
            content: 'Message 2',
            createdAt: new Date(),
            globalStatus: MessageStatus.SENT,
            hasAnyRead: true,
            hasEveryoneRead: false,
            type: MessageType.TEXT,
            uid: 'msg-2',
          },
        ],
        nextCursor: null,
        totalCount: 2,
      };

      mockConversationsService.loadMoreMessages.mockResolvedValue(mockMessages);

      const result = await controller.loadMoreMessages(conversationUid, mockRequest);

      expect(result).toEqual({
        data: mockMessages,
        message: 'Messages fetched successfully',
      });
      expect(mockConversationsService.loadMoreMessages).toHaveBeenCalledWith(
        conversationUid,
        'user-123',
        undefined,
        undefined,
      );
    });

    it('should handle cursor pagination', async () => {
      const mockRequest = {
        user: { uid: 'user-456' },
      } as any;
      const conversationUid = 'conv-456';
      const cursor = 'msg-cursor-123';

      const mockMessages = {
        items: [],
        nextCursor: 'msg-cursor-456',
        totalCount: 0,
      };

      mockConversationsService.loadMoreMessages.mockResolvedValue(mockMessages);

      const result = await controller.loadMoreMessages(conversationUid, mockRequest, cursor);

      expect(mockConversationsService.loadMoreMessages).toHaveBeenCalledWith(
        conversationUid,
        'user-456',
        cursor,
        undefined,
      );
      expect(result.data.nextCursor).toBe('msg-cursor-456');
    });

    it('should respect custom limit parameter', async () => {
      const mockRequest = {
        user: { uid: 'user-789' },
      } as any;
      const conversationUid = 'conv-789';
      const limit = 20;

      mockConversationsService.loadMoreMessages.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.loadMoreMessages(conversationUid, mockRequest, undefined, limit);

      expect(mockConversationsService.loadMoreMessages).toHaveBeenCalledWith(
        conversationUid,
        'user-789',
        undefined,
        20,
      );
    });

    it('should pass both cursor and limit parameters', async () => {
      const mockRequest = {
        user: { uid: 'user-111' },
      } as any;
      const conversationUid = 'conv-111';
      const cursor = 'msg-cursor-999';
      const limit = 10;

      mockConversationsService.loadMoreMessages.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.loadMoreMessages(conversationUid, mockRequest, cursor, limit);

      expect(mockConversationsService.loadMoreMessages).toHaveBeenCalledWith(
        conversationUid,
        'user-111',
        cursor,
        10,
      );
    });

    it('should extract user uid from request', async () => {
      const mockRequest = {
        user: { uid: 'different-user-123' },
      } as any;
      const conversationUid = 'conv-different';

      mockConversationsService.loadMoreMessages.mockResolvedValue({
        items: [],
        nextCursor: null,
        totalCount: 0,
      });

      await controller.loadMoreMessages(conversationUid, mockRequest);

      expect(mockConversationsService.loadMoreMessages).toHaveBeenCalledWith(
        conversationUid,
        'different-user-123',
        undefined,
        undefined,
      );
    });

    it('should return correct response format', async () => {
      const mockRequest = {
        user: { uid: 'user-format' },
      } as any;
      const conversationUid = 'conv-format';

      const mockMessages = {
        items: [
          {
            content: 'Test message',
            createdAt: new Date(),
            globalStatus: MessageStatus.SENT,
            hasAnyRead: false,
            hasEveryoneRead: false,
            type: MessageType.TEXT,
            uid: 'msg-test',
          },
        ],
        nextCursor: 'msg-next',
        totalCount: 1,
      };

      mockConversationsService.loadMoreMessages.mockResolvedValue(mockMessages);

      const result = await controller.loadMoreMessages(conversationUid, mockRequest);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message', 'Messages fetched successfully');
      expect(result.data).toEqual(mockMessages);
    });
  });

  describe('findAllMembers', () => {
    it('should return paginated members for a conversation', async () => {
      const conversationUid = 'conv-123';
      const mockMembers = {
        items: [
          {
            userUid: 'user-1',
            firstname: 'John',
            lastname: 'Doe',
            imageUrl: 'https://example.com/john.jpg',
            isAdmin: true,
            joinedAt: new Date(),
            sessionData: null,
          },
        ],
        totalCount: 1,
      };

      mockMembersService.findAllByConversationUid.mockResolvedValue(mockMembers);

      const result = await controller.findAllMembers(conversationUid);

      expect(result).toEqual({
        data: mockMembers,
        message: 'Members fetched successfully',
      });
      expect(mockMembersService.findAllByConversationUid).toHaveBeenCalledWith(conversationUid);
    });

    it('should return empty list when conversation has no members', async () => {
      const conversationUid = 'conv-empty';
      const mockMembers = { items: [], totalCount: 0 };

      mockMembersService.findAllByConversationUid.mockResolvedValue(mockMembers);

      const result = await controller.findAllMembers(conversationUid);

      expect(result.data.items).toHaveLength(0);
      expect(result.data.totalCount).toBe(0);
      expect(mockMembersService.findAllByConversationUid).toHaveBeenCalledWith(conversationUid);
    });
  });

  describe('updateMuteSettings', () => {
    it('should call membersService.updateMuteSettings with conversation uid, user uid and settings', async () => {
      const mockRequest = { user: { uid: 'user-123' } } as any;
      const conversationUid = 'conv-123';
      const settings = { isMuted: true };

      mockMembersService.updateMuteSettings.mockResolvedValue(undefined);

      await controller.updateMuteSettings(conversationUid, mockRequest, settings);

      expect(mockMembersService.updateMuteSettings).toHaveBeenCalledWith(
        conversationUid,
        'user-123',
        settings,
      );
    });
  });

  describe('updateArchivedSettings', () => {
    it('should call membersService.updateArchivedSettings with conversation uid, user uid and settings', async () => {
      const mockRequest = { user: { uid: 'user-456' } } as any;
      const conversationUid = 'conv-456';
      const settings = { isArchived: true };

      mockMembersService.updateArchivedSettings.mockResolvedValue(undefined);

      await controller.updateArchivedSettings(conversationUid, mockRequest, settings);

      expect(mockMembersService.updateArchivedSettings).toHaveBeenCalledWith(
        conversationUid,
        'user-456',
        settings,
      );
    });
  });

  describe('remove', () => {
    it('should call membersService.updateDisplayMessagesAfterDeletion with conversation uid and user uid', async () => {
      const mockRequest = { user: { uid: 'user-789' } } as any;
      const conversationUid = 'conv-789';

      mockMembersService.updateDisplayMessagesAfterDeletion.mockResolvedValue(undefined);

      await controller.remove(conversationUid, mockRequest);

      expect(mockMembersService.updateDisplayMessagesAfterDeletion).toHaveBeenCalledWith(
        conversationUid,
        'user-789',
      );
    });
  });
});

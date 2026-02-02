import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { MessagesService } from 'src/conversations/services/messages.service';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { EventTypes } from 'src/notifications/constants/event.types';
import { StorageFolderName } from 'src/shared/constants/constants';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockPrisma: any;
  let mockLogger: any;
  let mockEventEmitter: any;
  let mockStorageService: any;

  beforeEach(async () => {
    mockPrisma = {
      conversationMembers: {
        findFirst: jest.fn(),
      },
      messages: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      setContext: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockStorageService = {
      getSignedUrl: jest.fn(),
      upload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTextMessage', () => {
    it('should create a text message successfully', async () => {
      const senderUid = 'user-123';
      const content = 'Hello, world!';
      const conversationUid = 'conv-123';
      const sessionUid = null;

      const mockMessage = {
        content,
        conversationUid,
        createdAt: new Date(),
        globalStatus: MessageStatus.SENT,
        sender: {
          firstname: 'John',
          imageUrl: 'image.jpg',
          lastname: 'Doe',
          uid: senderUid,
        },
        senderUid,
        type: MessageType.TEXT,
        uid: 'msg-123',
        updatedAt: new Date(),
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messages.create.mockResolvedValue(mockMessage);

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockPrisma.messages.updateMany).toHaveBeenCalled();
      expect(mockPrisma.messages.create).toHaveBeenCalledWith({
        data: {
          content,
          conversation: {
            connect: { uid: conversationUid },
          },
          globalStatus: MessageStatus.SENT,
          sender: {
            connect: { uid: senderUid },
          },
          type: MessageType.TEXT,
        },
        include: {
          sender: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
              uid: true,
            },
          },
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: 'John Doe sent you a message',
        senderUid,
      });
    });

    it('should include sessionUid in notification title for session conversations', async () => {
      const senderUid = 'user-123';
      const content = 'Session message';
      const conversationUid = 'conv-123';
      const sessionUid = 'session-456';

      const mockMessage = {
        content,
        conversationUid,
        createdAt: new Date(),
        globalStatus: MessageStatus.SENT,
        sender: {
          firstname: 'Jane',
          imageUrl: null,
          lastname: 'Smith',
          uid: senderUid,
        },
        senderUid,
        type: MessageType.TEXT,
        uid: 'msg-123',
        updatedAt: new Date(),
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messages.create.mockResolvedValue(mockMessage);

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: `Session ${sessionUid} - Jane Smith sent you a message`,
        senderUid,
      });
    });
  });

  describe('createMediaMessage', () => {
    it('should create a media message successfully', async () => {
      const senderUid = 'user-123';
      const conversationUid = 'conv-123';
      const type = MessageType.IMAGE;
      const sessionUid = null;
      const file = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
      };

      const uploadedFile = {
        data: 'uploaded-file-path.jpg',
      };

      const mockMessage = {
        content: uploadedFile.data,
        conversationUid,
        createdAt: new Date(),
        globalStatus: MessageStatus.SENT,
        sender: {
          firstname: 'John',
          imageUrl: 'image.jpg',
          lastname: 'Doe',
          uid: senderUid,
        },
        senderUid,
        type,
        uid: 'msg-123',
        updatedAt: new Date(),
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockStorageService.upload.mockResolvedValue(uploadedFile);
      mockPrisma.messages.create.mockResolvedValue(mockMessage);

      await service.createMediaMessage(senderUid, conversationUid, type, file, sessionUid);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        `${StorageFolderName.CONVERSATIONS}/${conversationUid}`,
        file.originalname,
        file.buffer,
      );
      expect(mockPrisma.messages.create).toHaveBeenCalledWith({
        data: {
          content: uploadedFile.data,
          conversation: {
            connect: { uid: conversationUid },
          },
          sender: {
            connect: { uid: senderUid },
          },
          type,
        },
        include: {
          sender: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
              uid: true,
            },
          },
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content: uploadedFile.data,
        conversationUid,
        notificationTitle: 'John Doe sent you a message',
        senderUid,
      });
    });

    it('should throw BadRequestException when file is missing', async () => {
      const senderUid = 'user-123';
      const conversationUid = 'conv-123';
      const type = MessageType.IMAGE;
      const sessionUid = null;

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, null, sessionUid),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file buffer is missing', async () => {
      const senderUid = 'user-123';
      const conversationUid = 'conv-123';
      const type = MessageType.IMAGE;
      const sessionUid = null;
      const file = {
        originalname: 'test.jpg',
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, file, sessionUid),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file originalname is missing', async () => {
      const senderUid = 'user-123';
      const conversationUid = 'conv-123';
      const type = MessageType.IMAGE;
      const sessionUid = null;
      const file = {
        buffer: Buffer.from('data'),
      };

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({ uid: 'member-1' });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, file, sessionUid),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      const conversationUid = 'conv-123';
      const limit = 50;

      const mockMessages = [
        {
          content: 'Message 1',
          conversationUid,
          createdAt: new Date(),
          globalStatus: MessageStatus.SENT,
          messageReceipts: [
            { status: MessageStatus.READ, userUid: 'user-1' },
            { status: MessageStatus.SENT, userUid: 'user-2' },
          ],
          sender: {
            firstname: 'John',
            imageUrl: 'image.jpg',
            lastname: 'Doe',
            uid: 'user-1',
          },
          senderUid: 'user-1',
          type: MessageType.TEXT,
          uid: 'msg-1',
          updatedAt: new Date(),
        },
        {
          content: 'Message 2',
          conversationUid,
          createdAt: new Date(),
          globalStatus: MessageStatus.SENT,
          messageReceipts: [],
          sender: {
            firstname: 'Jane',
            imageUrl: null,
            lastname: 'Smith',
            uid: 'user-2',
          },
          senderUid: 'user-2',
          type: MessageType.TEXT,
          uid: 'msg-2',
          updatedAt: new Date(),
        },
      ];

      mockPrisma.messages.findMany.mockResolvedValue(mockMessages);
      mockStorageService.getSignedUrl.mockResolvedValue('signed-url');

      const result = await service.getMessages(conversationUid, undefined, limit);

      expect(mockPrisma.messages.findMany).toHaveBeenCalledWith({
        include: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        where: {
          conversationUid,
        },
      });
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should handle cursor pagination', async () => {
      const conversationUid = 'conv-123';
      const cursor = 'msg-cursor-123';
      const limit = 10;

      mockPrisma.messages.findMany.mockResolvedValue([]);
      mockStorageService.getSignedUrl.mockResolvedValue('signed-url');

      await service.getMessages(conversationUid, cursor, limit);

      expect(mockPrisma.messages.findMany).toHaveBeenCalledWith({
        cursor: {
          uid: cursor,
        },
        include: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 1,
        take: limit,
        where: {
          conversationUid,
        },
      });
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read for a user', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-1',
        userUid,
      });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(mockPrisma.conversationMembers.findFirst).toHaveBeenCalledWith({
        where: {
          conversationUid,
          userUid,
        },
      });
      expect(mockPrisma.messages.updateMany).toHaveBeenCalledWith({
        data: {
          globalStatus: MessageStatus.READ,
        },
        where: {
          conversationUid,
          globalStatus: {
            not: MessageStatus.READ,
          },
          senderUid: {
            not: userUid,
          },
        },
      });
      expect(result).toBe(5);
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.markMessagesAsRead(conversationUid, userUid)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.messages.updateMany).not.toHaveBeenCalled();
    });

    it('should return 0 when no messages to mark as read', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        uid: 'member-1',
        userUid,
      });
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(result).toBe(0);
    });
  });
});

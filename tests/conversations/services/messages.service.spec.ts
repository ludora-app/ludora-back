import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { MessagesService } from 'src/conversations/services/messages.service';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';

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
        findMany: jest.fn(),
        update: jest.fn(),
      },
      conversations: {
        update: jest.fn().mockResolvedValue({}),
      },
      messageReceipts: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      messages: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
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
      upload: jest.fn(),
      getSignedUrl: jest.fn(),
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
      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messageReceipts.findMany.mockResolvedValue([]);
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messages.create.mockResolvedValue(mockMessage);
      mockPrisma.conversationMembers.findMany.mockResolvedValue([{ userUid: 'user-456' }]);
      mockPrisma.messages.findMany.mockResolvedValue([]);
      mockPrisma.messageReceipts.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.messageReceipts.create.mockResolvedValue({});

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockPrisma.messageReceipts.findMany).toHaveBeenCalled();
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
      expect(mockPrisma.conversationMembers.findMany).toHaveBeenCalledWith({
        select: { userUid: true },
        where: { conversationUid, userUid: { not: senderUid } },
      });
      expect(mockPrisma.messageReceipts.createMany).toHaveBeenCalled();
      expect(mockPrisma.messageReceipts.create).toHaveBeenCalledWith({
        data: {
          messageUid: 'msg-123',
          status: MessageStatus.SENT,
          userUid: senderUid,
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: "John Doe t'a envoyé un message",
        senderAvatar: 'image.jpg',
        senderName: 'John Doe',
        senderUid,
        sessionUid: undefined,
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
      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messageReceipts.findMany.mockResolvedValue([]);
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messages.create.mockResolvedValue(mockMessage);
      mockPrisma.conversationMembers.findMany.mockResolvedValue([{ userUid: 'user-456' }]);
      mockPrisma.messages.findMany.mockResolvedValue([]);
      mockPrisma.messageReceipts.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.messageReceipts.create.mockResolvedValue({});

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: `Session ${sessionUid} - Jane Smith t'a envoyé un message`,
        senderAvatar: undefined,
        senderName: 'Jane Smith',
        senderUid,
        sessionUid,
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
      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messageReceipts.findMany.mockResolvedValue([]);
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockStorageService.upload.mockResolvedValue(uploadedFile);
      mockPrisma.messages.create.mockResolvedValue(mockMessage);
      mockPrisma.messages.findMany.mockResolvedValue([]);
      mockPrisma.conversationMembers.findMany.mockResolvedValue([{ userUid: 'user-456' }]);
      mockPrisma.messageReceipts.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.messageReceipts.create.mockResolvedValue({});

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
        notificationTitle: "John Doe t'a envoyé un message",
        senderAvatar: 'image.jpg',
        senderName: 'John Doe',
        senderUid,
        sessionUid: undefined,
      });
    });

    it('should throw BadRequestException when file is missing', async () => {
      const senderUid = 'user-123';
      const conversationUid = 'conv-123';
      const type = MessageType.IMAGE;
      const sessionUid = null;

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messages.findMany.mockResolvedValue([]);

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

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messages.findMany.mockResolvedValue([]);

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

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messages.findMany.mockResolvedValue([]);

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, file, sessionUid),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-1';
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

      const result = await service.getMessages(conversationUid, userUid, undefined, limit);

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
        take: limit + 1,
        where: {
          conversationUid,
        },
      });
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should handle cursor pagination', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-1';
      const cursor = 'msg-cursor-123';
      const limit = 10;

      mockPrisma.messages.findMany.mockResolvedValue([]);

      await service.getMessages(conversationUid, userUid, cursor, limit);

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
        take: limit + 1,
        where: {
          conversationUid,
        },
      });
    });
  });

  describe('getOtherMembersUids', () => {
    it('should return a Set of other member UIDs excluding the sender', async () => {
      const conversationUid = 'conv-123';
      const senderUid = 'user-123';
      const otherMembers = [{ userUid: 'user-456' }, { userUid: 'user-789' }];

      mockPrisma.conversationMembers.findMany.mockResolvedValue(otherMembers);

      const result = await service.getOtherMembersUids(conversationUid, senderUid);

      expect(mockPrisma.conversationMembers.findMany).toHaveBeenCalledWith({
        select: { userUid: true },
        where: { conversationUid, userUid: { not: senderUid } },
      });
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has('user-456')).toBe(true);
      expect(result.has('user-789')).toBe(true);
      expect(result.has(senderUid)).toBe(false);
    });

    it('should return empty Set when there are no other members', async () => {
      const conversationUid = 'conv-123';
      const senderUid = 'user-123';

      mockPrisma.conversationMembers.findMany.mockResolvedValue([]);

      const result = await service.getOtherMembersUids(conversationUid, senderUid);

      expect(mockPrisma.conversationMembers.findMany).toHaveBeenCalledWith({
        select: { userUid: true },
        where: { conversationUid, userUid: { not: senderUid } },
      });
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });

  describe('createMessageReceipt', () => {
    it('should create receipts for all other members and sender with SENT status', async () => {
      const messageUid = 'msg-123';
      const userUids = new Set(['user-456', 'user-789']);
      const senderUid = 'user-123';

      mockPrisma.messageReceipts.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.messageReceipts.create.mockResolvedValue({});

      await service.createMessageReceipt(messageUid, userUids, senderUid);

      expect(mockPrisma.messageReceipts.createMany).toHaveBeenCalledWith({
        data: [
          { messageUid, userUid: 'user-456' },
          { messageUid, userUid: 'user-789' },
        ],
      });
      expect(mockPrisma.messageReceipts.create).toHaveBeenCalledWith({
        data: {
          messageUid,
          status: MessageStatus.SENT,
          userUid: senderUid,
        },
      });
    });

    it('should call createMany with empty array when no other members', async () => {
      const messageUid = 'msg-123';
      const userUids = new Set<string>();
      const senderUid = 'user-123';

      mockPrisma.messageReceipts.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.messageReceipts.create.mockResolvedValue({});

      await service.createMessageReceipt(messageUid, userUids, senderUid);

      expect(mockPrisma.messageReceipts.createMany).toHaveBeenCalledWith({
        data: [],
      });
      expect(mockPrisma.messageReceipts.create).toHaveBeenCalledWith({
        data: {
          messageUid,
          status: MessageStatus.SENT,
          userUid: senderUid,
        },
      });
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read for a user', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';
      const targetMessageUids = ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5'];

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messageReceipts.findMany.mockResolvedValue(
        targetMessageUids.map((uid) => ({ messageUid: uid })),
      );
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.messageReceipts.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.messages.findMany.mockResolvedValue(
        targetMessageUids.map((uid) => ({
          uid,
          senderUid: 'other-user',
          messageReceipts: [{ status: MessageStatus.READ, userUid: userUid }],
        })),
      );

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(mockPrisma.conversationMembers.update).toHaveBeenCalledWith({
        data: {
          lastReadAt: expect.any(Date),
        },
        where: {
          conversationUid_userUid: {
            conversationUid,
            userUid,
          },
        },
      });
      expect(mockPrisma.messageReceipts.findMany).toHaveBeenCalledWith({
        select: { messageUid: true },
        where: {
          userUid,
          status: { not: MessageStatus.READ },
          message: {
            conversationUid,
            senderUid: { not: userUid },
          },
        },
      });
      expect(mockPrisma.messages.updateMany).toHaveBeenCalledWith({
        data: { globalStatus: MessageStatus.READ },
        where: { uid: { in: targetMessageUids } },
      });
      expect(mockPrisma.messageReceipts.updateMany).toHaveBeenCalledWith({
        data: { status: MessageStatus.READ },
        where: { messageUid: { in: targetMessageUids }, userUid },
      });
      expect(result.count).toBe(5);
      expect(result.messages.length).toBe(5);
    });

    it('should update the receipt even when globalStatus is already READ (read by another member first)', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-delivered';
      const messageUid = 'msg-already-global-read';

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      // The receipt is DELIVERED even though globalStatus is already READ
      mockPrisma.messageReceipts.findMany.mockResolvedValue([{ messageUid }]);
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.messageReceipts.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.messages.findMany.mockResolvedValue([
        {
          uid: messageUid,
          senderUid: 'other-user',
          messageReceipts: [{ status: MessageStatus.READ, userUid: userUid }],
        },
      ]);

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(mockPrisma.messageReceipts.updateMany).toHaveBeenCalledWith({
        data: { status: MessageStatus.READ },
        where: { messageUid: { in: [messageUid] }, userUid },
      });
      expect(result.count).toBe(1);
      expect(result.messages.length).toBe(1);
    });

    it('should throw error when user is not a member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.markMessagesAsRead(conversationUid, userUid)).rejects.toThrow();
      expect(mockPrisma.messageReceipts.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.messages.updateMany).not.toHaveBeenCalled();
    });

    it('should return 0 when no unread receipts', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.update.mockResolvedValue({});
      mockPrisma.messageReceipts.findMany.mockResolvedValue([]);
      mockPrisma.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messageReceipts.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.messages.findMany.mockResolvedValue([]);

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(result.count).toBe(0);
      expect(result.messages.length).toBe(0);
    });
  });

  describe('delete', () => {
    it('should soft-delete a message by setting globalStatus to DELETED when user is sender', async () => {
      const messageUid = 'msg-123';
      const userUid = 'user-123';

      const mockMessage = {
        uid: messageUid,
        senderUid: userUid,
        globalStatus: MessageStatus.SENT,
        conversation: { sessionUid: 'session-123' },
        sender: { firstname: 'John', lastname: 'Doe' },
      };

      mockPrisma.messages.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.messages.update.mockResolvedValue({
        uid: messageUid,
        globalStatus: MessageStatus.DELETED,
      });

      await service.delete(messageUid, userUid);

      expect(mockPrisma.messages.findUnique).toHaveBeenCalledWith({
        include: {
          conversation: {
            select: { sessionUid: true },
          },
          sender: {
            select: { firstname: true, lastname: true },
          },
        },
        where: { uid: messageUid },
      });
      expect(mockPrisma.messages.update).toHaveBeenCalledWith({
        data: {
          globalStatus: MessageStatus.DELETED,
        },
        where: { uid: messageUid },
      });
    });

    it('should call prisma.messages.update with correct messageUid and userUid', async () => {
      const messageUid = 'msg-456';
      const userUid = 'user-456';

      mockPrisma.messages.findUnique.mockResolvedValue({
        uid: messageUid,
        senderUid: userUid,
        globalStatus: MessageStatus.SENT,
        conversation: { sessionUid: 'session-456' },
        sender: { firstname: 'Jane', lastname: 'Smith' },
      });
      mockPrisma.messages.update.mockResolvedValue({});

      await service.delete(messageUid, userUid);

      expect(mockPrisma.messages.findUnique).toHaveBeenCalledWith({
        include: {
          conversation: {
            select: { sessionUid: true },
          },
          sender: {
            select: { firstname: true, lastname: true },
          },
        },
        where: { uid: 'msg-456' },
      });
      expect(mockPrisma.messages.update).toHaveBeenCalledWith({
        data: { globalStatus: MessageStatus.DELETED },
        where: { uid: 'msg-456' },
      });
    });

    it('should return void on success', async () => {
      const messageUid = 'msg-789';
      const userUid = 'user-789';

      mockPrisma.messages.findUnique.mockResolvedValue({
        uid: messageUid,
        senderUid: userUid,
        globalStatus: MessageStatus.SENT,
        conversation: { sessionUid: 'session-789' },
        sender: { firstname: 'John', lastname: 'Doe' },
      });
      mockPrisma.messages.update.mockResolvedValue({});

      const result = await service.delete(messageUid, userUid);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when message does not exist', async () => {
      const messageUid = 'msg-not-found';
      const userUid = 'user-123';

      mockPrisma.messages.findUnique.mockResolvedValue(null);

      await expect(service.delete(messageUid, userUid)).rejects.toThrow(NotFoundException);
      await expect(service.delete(messageUid, userUid)).rejects.toThrow('Message not found');
      expect(mockPrisma.messages.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the sender', async () => {
      const messageUid = 'msg-123';
      const userUid = 'user-other';
      const senderUid = 'user-sender';

      mockPrisma.messages.findUnique.mockResolvedValue({
        uid: messageUid,
        senderUid,
        globalStatus: MessageStatus.SENT,
      });

      await expect(service.delete(messageUid, userUid)).rejects.toThrow(ForbiddenException);
      await expect(service.delete(messageUid, userUid)).rejects.toThrow(
        'You are not the sender of this message',
      );
      expect(mockPrisma.messages.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when message is already deleted', async () => {
      const messageUid = 'msg-123';
      const userUid = 'user-123';

      mockPrisma.messages.findUnique.mockResolvedValue({
        uid: messageUid,
        senderUid: userUid,
        globalStatus: MessageStatus.DELETED,
      });

      await expect(service.delete(messageUid, userUid)).rejects.toThrow(BadRequestException);
      await expect(service.delete(messageUid, userUid)).rejects.toThrow('Message already deleted');
      expect(mockPrisma.messages.update).not.toHaveBeenCalled();
    });
  });
});

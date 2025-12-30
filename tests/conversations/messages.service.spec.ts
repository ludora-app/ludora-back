import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagesService } from 'src/conversations/messages.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { EventTypes } from 'src/notifications/constants/event.types';
import { StorageFolderName } from 'src/shared/constants/constants';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockPrismaService: any;
  let mockStorageService: any;
  let mockEventEmitter: any;

  const mockPinoLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    setContext: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      messages: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      conversationMembers: {
        findFirst: jest.fn(),
      },
    };

    mockStorageService = {
      upload: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockPinoLogger,
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

  describe('createTextMessage', () => {
    const senderUid = 'user-123';
    const content = 'Hello, this is a test message';
    const conversationUid = 'conv-123';
    const sessionUid = null;

    const mockSender = {
      firstname: 'John',
      lastname: 'Doe',
      imageUrl: 'https://example.com/image.jpg',
      uid: senderUid,
    };

    const mockMessage = {
      uid: 'msg-123',
      content,
      conversationUid,
      senderUid,
      type: MessageType.TEXT,
      globalStatus: MessageStatus.SENT,
      sender: mockSender,
    };

    beforeEach(() => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        userUid: senderUid,
      });
      mockPrismaService.messages.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.messages.create.mockResolvedValue(mockMessage);
    });

    it('should create a text message successfully', async () => {
      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockPrismaService.messages.updateMany).toHaveBeenCalledWith({
        data: {
          globalStatus: MessageStatus.READ,
        },
        where: {
          conversationUid,
          globalStatus: {
            not: MessageStatus.READ,
          },
          senderUid: {
            not: senderUid,
          },
        },
      });

      expect(mockPrismaService.messages.create).toHaveBeenCalledWith({
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

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(
        `Message ${mockMessage.uid} created in conversation ${conversationUid} by user ${senderUid}`,
      );
    });

    it('should include sessionUid in notification title when sessionUid is provided', async () => {
      const sessionUidWithValue = 'session-456';
      await service.createTextMessage(senderUid, content, conversationUid, sessionUidWithValue);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: `Session ${sessionUidWithValue} - John Doe sent you a message`,
        senderUid,
      });
    });

    it('should handle sender with missing firstname or lastname', async () => {
      const mockMessageWithoutName = {
        ...mockMessage,
        sender: {
          ...mockSender,
          firstname: null,
          lastname: null,
        },
      };
      mockPrismaService.messages.create.mockResolvedValue(mockMessageWithoutName);

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content,
        conversationUid,
        notificationTitle: ' sent you a message',
        senderUid,
      });
    });

    it('should mark messages as read before creating new message', async () => {
      const updateManySpy = jest.spyOn(mockPrismaService.messages, 'updateMany');
      const createSpy = jest.spyOn(mockPrismaService.messages, 'create');

      await service.createTextMessage(senderUid, content, conversationUid, sessionUid);

      expect(updateManySpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
      expect(updateManySpy.mock.invocationCallOrder[0]).toBeLessThan(
        createSpy.mock.invocationCallOrder[0],
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(
        service.createTextMessage(senderUid, content, conversationUid, sessionUid),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createTextMessage(senderUid, content, conversationUid, sessionUid),
      ).rejects.toThrow(`User ${senderUid} is not a member of conversation ${conversationUid}`);
    });
  });

  describe('createMediaMessage', () => {
    const senderUid = 'user-123';
    const conversationUid = 'conv-123';
    const type = MessageType.IMAGE;
    const sessionUid = null;

    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      fieldname: 'file',
    };

    const mockSender = {
      firstname: 'Jane',
      lastname: 'Smith',
      imageUrl: 'https://example.com/image2.jpg',
      uid: senderUid,
    };

    const mockUploadedFile = {
      data: '1234567890test-image.jpg',
    };

    const mockMessage = {
      uid: 'msg-456',
      content: mockUploadedFile.data,
      conversationUid,
      senderUid,
      type: MessageType.IMAGE,
      sender: mockSender,
    };

    beforeEach(() => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        userUid: senderUid,
      });
      mockPrismaService.messages.updateMany.mockResolvedValue({ count: 0 });
      mockStorageService.upload.mockResolvedValue(mockUploadedFile);
      mockPrismaService.messages.create.mockResolvedValue(mockMessage);
    });

    it('should create a media message successfully', async () => {
      await service.createMediaMessage(senderUid, conversationUid, type, mockFile, sessionUid);

      expect(mockPrismaService.messages.updateMany).toHaveBeenCalledWith({
        data: {
          globalStatus: MessageStatus.READ,
        },
        where: {
          conversationUid,
          globalStatus: {
            not: MessageStatus.READ,
          },
          senderUid: {
            not: senderUid,
          },
        },
      });

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        `${StorageFolderName.CONVERSATIONS}/${conversationUid}`,
        mockFile.originalname,
        mockFile.buffer,
      );

      expect(mockPrismaService.messages.create).toHaveBeenCalledWith({
        data: {
          content: mockUploadedFile.data,
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
        content: mockUploadedFile.data,
        conversationUid,
        notificationTitle: 'Jane Smith sent you a message',
        senderUid,
      });

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(
        `Message ${mockMessage.uid} created in conversation ${conversationUid} by user ${senderUid}`,
      );
    });

    it('should include sessionUid in notification title when sessionUid is provided', async () => {
      const sessionUidWithValue = 'session-789';
      await service.createMediaMessage(
        senderUid,
        conversationUid,
        type,
        mockFile,
        sessionUidWithValue,
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EventTypes.NEW_MESSAGE, {
        content: mockUploadedFile.data,
        conversationUid,
        notificationTitle: `Session ${sessionUidWithValue} - Jane Smith sent you a message`,
        senderUid,
      });
    });

    it('should throw BadRequestException when file is undefined', async () => {
      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, undefined, sessionUid),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, undefined, sessionUid),
      ).rejects.toThrow('File is required for media messages');
    });

    it('should throw BadRequestException when file.buffer is missing', async () => {
      const invalidFile = {
        originalname: 'test.jpg',
      };

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, invalidFile, sessionUid),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, invalidFile, sessionUid),
      ).rejects.toThrow('File is required for media messages');
    });

    it('should throw BadRequestException when file.originalname is missing', async () => {
      const invalidFile = {
        buffer: Buffer.from('data'),
      };

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, invalidFile, sessionUid),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, invalidFile, sessionUid),
      ).rejects.toThrow('File is required for media messages');
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, mockFile, sessionUid),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createMediaMessage(senderUid, conversationUid, type, mockFile, sessionUid),
      ).rejects.toThrow(`User ${senderUid} is not a member of conversation ${conversationUid}`);
    });

    it('should handle different message types', async () => {
      const videoType = MessageType.VIDEO;
      await service.createMediaMessage(senderUid, conversationUid, videoType, mockFile, sessionUid);

      expect(mockPrismaService.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: videoType,
          }),
        }),
      );
    });

    it('should mark messages as read before uploading file', async () => {
      const updateManySpy = jest.spyOn(mockPrismaService.messages, 'updateMany');
      const uploadSpy = jest.spyOn(mockStorageService, 'upload');

      await service.createMediaMessage(senderUid, conversationUid, type, mockFile, sessionUid);

      expect(updateManySpy).toHaveBeenCalled();
      expect(uploadSpy).toHaveBeenCalled();
      expect(updateManySpy.mock.invocationCallOrder[0]).toBeLessThan(
        uploadSpy.mock.invocationCallOrder[0],
      );
    });
  });

  describe('markMessagesAsRead', () => {
    const conversationUid = 'conv-123';
    const userUid = 'user-123';

    it('should mark messages as read successfully', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue({
        conversationUid,
        userUid,
      });
      mockPrismaService.messages.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markMessagesAsRead(conversationUid, userUid);

      expect(result).toBe(5);
      expect(mockPrismaService.messages.updateMany).toHaveBeenCalledWith({
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

      expect(mockPinoLogger.debug).toHaveBeenCalledWith(
        `Marked 5 messages as read for user ${userUid} in conversation ${conversationUid}`,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.conversationMembers.findFirst.mockResolvedValue(null);

      await expect(service.markMessagesAsRead(conversationUid, userUid)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.markMessagesAsRead(conversationUid, userUid)).rejects.toThrow(
        `User ${userUid} is not a member of conversation ${conversationUid}`,
      );
    });
  });
});

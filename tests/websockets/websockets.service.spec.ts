import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketsService } from '../../src/shared/websockets/websockets.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/enums';
import { Messages } from 'generated/prisma/browser';

// Mock uuid
let uuidCounter = 0;
jest.mock('uuid', () => ({
  default: {
    v4: jest.fn(() => `mocked-uuid-${uuidCounter++}`),
  },
}));

describe('WebsocketsService', () => {
  let service: WebsocketsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    conversations: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    messages: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebsocketsService>(WebsocketsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Socket Management', () => {
    describe('addUser', () => {
      it('should add a user to the maps', () => {
        service.addUser('user-123', 'socket-abc');

        expect(service.getUserSocketUid('user-123')).toBe('socket-abc');
      });

      it('should update socket when same user connects again', () => {
        service.addUser('user-123', 'socket-abc');
        service.addUser('user-123', 'socket-xyz');

        expect(service.getUserSocketUid('user-123')).toBe('socket-xyz');
      });

      it('should handle multiple users', () => {
        service.addUser('user-1', 'socket-1');
        service.addUser('user-2', 'socket-2');
        service.addUser('user-3', 'socket-3');

        expect(service.getUserSocketUid('user-1')).toBe('socket-1');
        expect(service.getUserSocketUid('user-2')).toBe('socket-2');
        expect(service.getUserSocketUid('user-3')).toBe('socket-3');
      });
    });

    describe('removeUser', () => {
      it('should remove a user by socket uid', () => {
        service.addUser('user-123', 'socket-abc');
        service.removeUser('socket-abc');

        expect(service.getUserSocketUid('user-123')).toBeUndefined();
      });

      it('should handle removing non-existent socket', () => {
        expect(() => service.removeUser('non-existent')).not.toThrow();
      });

      it('should only remove the specified user', () => {
        service.addUser('user-1', 'socket-1');
        service.addUser('user-2', 'socket-2');

        service.removeUser('socket-1');

        expect(service.getUserSocketUid('user-1')).toBeUndefined();
        expect(service.getUserSocketUid('user-2')).toBe('socket-2');
      });
    });

    describe('getUserSocketUid', () => {
      it('should return socket uid for existing user', () => {
        service.addUser('user-123', 'socket-abc');

        expect(service.getUserSocketUid('user-123')).toBe('socket-abc');
      });

      it('should return undefined for non-existent user', () => {
        expect(service.getUserSocketUid('non-existent')).toBeUndefined();
      });
    });
  });

  describe('Group Management', () => {
    describe('addUserToGroup', () => {
      it('should add a user to a group', () => {
        service.addUserToGroup('user-123', 'group-abc');

        expect(service.isUserInGroup('user-123', 'group-abc')).toBe(true);
      });

      it('should create group if it does not exist', () => {
        service.addUserToGroup('user-123', 'new-group');

        expect(service.isUserInGroup('user-123', 'new-group')).toBe(true);
      });

      it('should add multiple users to the same group', () => {
        service.addUserToGroup('user-1', 'group-abc');
        service.addUserToGroup('user-2', 'group-abc');
        service.addUserToGroup('user-3', 'group-abc');

        expect(service.isUserInGroup('user-1', 'group-abc')).toBe(true);
        expect(service.isUserInGroup('user-2', 'group-abc')).toBe(true);
        expect(service.isUserInGroup('user-3', 'group-abc')).toBe(true);
      });

      it('should not duplicate users in a group', () => {
        service.addUserToGroup('user-123', 'group-abc');
        service.addUserToGroup('user-123', 'group-abc');

        expect(service.isUserInGroup('user-123', 'group-abc')).toBe(true);
      });
    });

    describe('removeUserFromGroup', () => {
      it('should remove a user from a group', () => {
        service.addUserToGroup('user-123', 'group-abc');
        service.removeUserFromGroup('user-123', 'group-abc');

        expect(service.isUserInGroup('user-123', 'group-abc')).toBe(false);
      });

      it('should handle removing user from non-existent group', () => {
        expect(() => service.removeUserFromGroup('user-123', 'non-existent')).not.toThrow();
      });

      it('should not affect other users in the group', () => {
        service.addUserToGroup('user-1', 'group-abc');
        service.addUserToGroup('user-2', 'group-abc');

        service.removeUserFromGroup('user-1', 'group-abc');

        expect(service.isUserInGroup('user-1', 'group-abc')).toBe(false);
        expect(service.isUserInGroup('user-2', 'group-abc')).toBe(true);
      });
    });

    describe('isUserInGroup', () => {
      it('should return true if user is in group', () => {
        service.addUserToGroup('user-123', 'group-abc');

        expect(service.isUserInGroup('user-123', 'group-abc')).toBe(true);
      });

      it('should return false if user is not in group', () => {
        expect(service.isUserInGroup('user-123', 'group-abc')).toBe(false);
      });

      it('should return false for non-existent group', () => {
        expect(service.isUserInGroup('user-123', 'non-existent')).toBe(false);
      });
    });

    describe('createGroup', () => {
      it('should create a group with a name', async () => {
        const mockGroup = {
          uid: expect.any(String),
          name: 'Test Group',
          type: ConversationType.GROUP,
        };

        mockPrismaService.conversations.create.mockResolvedValue(mockGroup);

        const groupUid = await service.createGroup('Test Group');

        expect(groupUid).toBeDefined();
        expect(typeof groupUid).toBe('string');
        expect(mockPrismaService.conversations.create).toHaveBeenCalledWith({
          data: {
            name: 'Test Group',
            type: ConversationType.GROUP,
            uid: groupUid,
          },
        });
      });

      it('should create unique group uids', async () => {
        mockPrismaService.conversations.create.mockResolvedValue({});

        const group1 = await service.createGroup('Group 1');
        const group2 = await service.createGroup('Group 2');

        expect(group1).not.toBe(group2);
      });
    });
  });

  describe('Message Management', () => {
    describe('createMessage', () => {
      it('should create a message in a conversation', async () => {
        const mockMessage = {
          uid: 'message-123',
          content: 'Hello',
          status: 'SENT',
        };

        mockPrismaService.messages.create.mockResolvedValue(mockMessage);
        mockPrismaService.conversations.update.mockResolvedValue({});

        await service.createMessage(
          'sender-123',
          'receiver-456',
          'Hello',
          'conversation-789',
          MessageType.TEXT,
        );

        expect(mockPrismaService.messages.create).toHaveBeenCalledWith({
          data: {
            content: 'Hello',
            conversation: {
              connect: { uid: 'conversation-789' },
            },
            sender: {
              connect: { uid: 'sender-123' },
            },
            status: 'SENT',
            type: MessageType.TEXT,
          },
        });

        expect(mockPrismaService.conversations.update).toHaveBeenCalledWith({
          data: { updatedAt: expect.any(Date) },
          where: { uid: 'conversation-789' },
        });
      });

      it('should handle different message types', async () => {
        mockPrismaService.messages.create.mockResolvedValue({});
        mockPrismaService.conversations.update.mockResolvedValue({});

        await service.createMessage(
          'sender-123',
          'receiver-456',
          'image.jpg',
          'conversation-789',
          MessageType.IMAGE,
        );

        expect(mockPrismaService.messages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: MessageType.IMAGE,
            }),
          }),
        );
      });

      it('should update conversation timestamp', async () => {
        const beforeTime = new Date();
        mockPrismaService.messages.create.mockResolvedValue({});
        mockPrismaService.conversations.update.mockResolvedValue({});

        await service.createMessage(
          'sender-123',
          'receiver-456',
          'Test message',
          'conversation-789',
          MessageType.TEXT,
        );

        expect(mockPrismaService.conversations.update).toHaveBeenCalledWith({
          data: { updatedAt: expect.any(Date) },
          where: { uid: 'conversation-789' },
        });

        const updateCall = mockPrismaService.conversations.update.mock.calls[0][0];
        expect(updateCall.data.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      });
    });

    describe('createGroupMessage', () => {
      it('should create a group message', async () => {
        const mockConversation = {
          uid: 'group-123',
          type: ConversationType.GROUP,
        };

        const mockMessage: Partial<Messages> = {
          uid: 'message-123',
          content: 'Group message',
          status: MessageStatus.SENT,
          type: MessageType.TEXT,
        };

        mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
        mockPrismaService.messages.create.mockResolvedValue(mockMessage);

        const result = await service.createGroupMessage(
          'sender-123',
          'group-123',
          'Group message',
          MessageType.TEXT,
        );

        expect(mockPrismaService.conversations.findUnique).toHaveBeenCalledWith({
          where: { uid: 'group-123' },
        });

        expect(mockPrismaService.messages.create).toHaveBeenCalledWith({
          data: {
            content: 'Group message',
            conversation: {
              connect: { uid: 'group-123' },
            },
            sender: {
              connect: { uid: 'sender-123' },
            },
            status: MessageStatus.SENT,
            type: MessageType.TEXT,
          },
        });

        expect(result).toEqual(mockMessage);
      });

      it('should throw error if conversation does not exist', async () => {
        mockPrismaService.conversations.findUnique.mockResolvedValue(null);

        await expect(
          service.createGroupMessage(
            'sender-123',
            'non-existent-group',
            'Message',
            MessageType.TEXT,
          ),
        ).rejects.toThrow('Conversation with uid non-existent-group not found');
      });

      it('should handle different message types in group', async () => {
        const mockConversation = { uid: 'group-123' };
        const mockMessage: Partial<Messages> = {
          uid: 'message-456',
          type: MessageType.VIDEO,
        };

        mockPrismaService.conversations.findUnique.mockResolvedValue(mockConversation);
        mockPrismaService.messages.create.mockResolvedValue(mockMessage);

        await service.createGroupMessage('sender-123', 'group-123', 'video.mp4', MessageType.VIDEO);

        expect(mockPrismaService.messages.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: MessageType.VIDEO,
            }),
          }),
        );
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';

describe('ConversationMembersService', () => {
  let service: ConversationMembersService;
  let mockPrisma: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockPrisma = {
      conversationMembers: {
        create: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationMembersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ConversationMembersService>(ConversationMembersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a conversation member', async () => {
      const conversationUid = 'conv-123';
      const userUid = 'user-123';

      mockPrisma.conversationMembers.create.mockResolvedValue(undefined);

      await service.create(conversationUid, userUid);

      expect(mockPrisma.conversationMembers.create).toHaveBeenCalledWith({
        data: {
          conversationUid,
          userUid,
        },
      });
    });
  });

  describe('createMany', () => {
    it('should create multiple conversation members', async () => {
      const conversationUid = 'conv-456';
      const userUids = ['user-1', 'user-2', 'user-3'];

      mockPrisma.conversationMembers.createMany.mockResolvedValue({ count: 3 });

      await service.createMany(conversationUid, userUids);

      expect(mockPrisma.conversationMembers.createMany).toHaveBeenCalledWith({
        data: [
          { conversationUid, userUid: 'user-1' },
          { conversationUid, userUid: 'user-2' },
          { conversationUid, userUid: 'user-3' },
        ],
      });
    });
  });

  describe('updateMuteSettings', () => {
    it('should update mute settings', async () => {
      mockPrisma.conversationMembers.update.mockResolvedValue(undefined);

      await service.updateMuteSettings('conv-1', 'user-1', { isMuted: true });

      expect(mockPrisma.conversationMembers.update).toHaveBeenCalledWith({
        data: { isMuted: true },
        where: { conversationUid_userUid: { conversationUid: 'conv-1', userUid: 'user-1' } },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('updateArchivedSettings', () => {
    it('should update archived settings', async () => {
      mockPrisma.conversationMembers.update.mockResolvedValue(undefined);

      await service.updateArchivedSettings('conv-1', 'user-1', { isArchived: true });

      expect(mockPrisma.conversationMembers.update).toHaveBeenCalledWith({
        data: { isArchived: true },
        where: { conversationUid_userUid: { conversationUid: 'conv-1', userUid: 'user-1' } },
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('updateDisplayMessagesAfterDeletion', () => {
    it('should update displayMessagesAfter and isVisible', async () => {
      mockPrisma.conversationMembers.update.mockImplementation((args: any) => {
        expect(args.data.displayMessagesAfter).toBeInstanceOf(Date);
        expect(args.data.isVisible).toBe(false);
        return Promise.resolve(undefined);
      });

      await service.updateDisplayMessagesAfterDeletion('conv-1', 'user-1');

      expect(mockPrisma.conversationMembers.update).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isVisible: false,
        }),
        where: { conversationUid_userUid: { conversationUid: 'conv-1', userUid: 'user-1' } },
      });
      const call = mockPrisma.conversationMembers.update.mock.calls[0][0];
      expect(call.data.displayMessagesAfter).toBeInstanceOf(Date);
    });
  });
});

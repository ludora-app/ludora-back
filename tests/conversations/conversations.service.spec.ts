import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ConversationsService } from 'src/conversations/conversations.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  const mockPrismaService = {
    conversations: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    conversationMembers: {
      createMany: jest.fn(),
    },
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
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
});

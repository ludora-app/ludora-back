import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionPlayersService } from 'src/session-players/session-players.service';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;
  let logger: PinoLogger;
  const mockPrismaService = {
    session_players: {
      create: jest.fn(),
    },
  };
  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlayersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SessionPlayersService>(SessionPlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

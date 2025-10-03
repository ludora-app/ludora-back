import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionPlayersService } from 'src/sessions/session-players.service';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;

  const mockPrismaService = {
    session_players: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionPlayersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SessionPlayersService>(SessionPlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

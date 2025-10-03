import { Test, TestingModule } from '@nestjs/testing';
import { SessionPlayersService } from '../session-players.service';

describe('SessionPlayersService', () => {
  let service: SessionPlayersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionPlayersService],
    }).compile();

    service = module.get<SessionPlayersService>(SessionPlayersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

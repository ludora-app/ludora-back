import { Test, TestingModule } from '@nestjs/testing';
import { SessionTeamsService } from '../session-teams.service';

describe('SessionTeamsService', () => {
  let service: SessionTeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionTeamsService],
    }).compile();

    service = module.get<SessionTeamsService>(SessionTeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

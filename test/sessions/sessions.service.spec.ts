import { SessionsService } from './../../src/sessions/sessions.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('SessionsServiceice', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsService],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

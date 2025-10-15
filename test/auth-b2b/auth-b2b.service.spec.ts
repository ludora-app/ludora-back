import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2bService } from './auth-b2b.service';

describe('AuthB2bService', () => {
  let service: AuthB2bService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthB2bService],
    }).compile();

    service = module.get<AuthB2bService>(AuthB2bService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

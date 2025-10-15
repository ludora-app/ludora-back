import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2bController } from '../../src/auth-b2b/auth-b2b.controller';
import { AuthB2bService } from '../../src/auth-b2b/auth-b2b.service';

describe('AuthB2bController', () => {
  let controller: AuthB2bController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthB2bController],
      providers: [AuthB2bService],
    }).compile();

    controller = module.get<AuthB2bController>(AuthB2bController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from 'src/ratings/ratings.controller';
import { RatingsService } from 'src/ratings/ratings.service';

describe('RatingsController', () => {
  let controller: RatingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [RatingsService],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

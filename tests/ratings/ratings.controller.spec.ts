import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import { Sessions } from 'generated/prisma/browser';
import { CreateRatingDto } from 'src/ratings/dto/input/create-rating.dto';
import { RatingsController } from 'src/ratings/ratings.controller';
import { RatingsService } from 'src/ratings/ratings.service';
import { SessionsPipe } from 'src/sessions/pipes/sessions.pipe';
import { Sport } from 'src/shared/constants/constants';

describe('RatingsController', () => {
  let controller: RatingsController;
  let service: RatingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: {
            createMany: jest.fn(),
          },
        },
      ],
    })
      .overridePipe(SessionsPipe)
      .useValue({ transform: jest.fn((val) => val) })
      .compile();

    controller = module.get<RatingsController>(RatingsController);
    service = module.get<RatingsService>(RatingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMany', () => {
    it('should call ratingsService.createMany with correct parameters', async () => {
      const mockRatings: CreateRatingDto[] = [
        { sport: Sport.FOOTBALL, rating: 5, targetUserUid: 'user-2' } as any,
      ];
      const mockSession = { uid: 'session-1' } as Sessions;
      const mockReq = { user: { uid: 'evaluator-1' } } as unknown as FastifyRequest;
      const expectedResult = [{ uid: 'rating-1' }];

      jest.spyOn(service, 'createMany').mockResolvedValue(expectedResult as any);

      const result = await controller.createMany(mockRatings, mockSession, mockReq);

      expect(service.createMany).toHaveBeenCalledWith(mockRatings, 'evaluator-1', mockSession);
      expect(result).toEqual(expectedResult);
    });
  });
});

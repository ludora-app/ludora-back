import { Test, TestingModule } from '@nestjs/testing';
import { GameModes } from 'generated/prisma/enums';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Sport } from 'src/shared/constants/constants';
import { SportsController } from 'src/sports/sports.controller';
import { SportsService } from 'src/sports/sports.service';

describe('SportsController', () => {
  let controller: SportsController;

  const mockSportsService = {
    findAllActivated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportsController],
      providers: [{ provide: SportsService, useValue: mockSportsService }],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SportsController>(SportsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return the opened sports in the response envelope', async () => {
      const data = {
        items: [
          { gameModes: [{ code: GameModes.TWO_V_TWO, playersPerTeam: 2 }], name: Sport.PADEL },
        ],
        nextCursor: null,
        totalCount: 1,
      };
      mockSportsService.findAllActivated.mockResolvedValue(data);

      const result = await controller.findAll();

      expect(mockSportsService.findAllActivated).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data, message: 'Sports fetched successfully' });
    });
  });
});

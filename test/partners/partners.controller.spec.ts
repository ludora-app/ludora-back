import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2BGuard } from 'src/auth-b2b/guards/auth-b2b.guard';
import { PartnersController } from 'src/partners/partners.controller';
import { PartnersService } from 'src/partners/partners.service';

describe('PartnersController', () => {
  let controller: PartnersController;

  const mockPartnersService = {
    create: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartnersController],
      providers: [
        {
          provide: PartnersService,
          useValue: mockPartnersService,
        },
      ],
    })
      .overrideGuard(AuthB2BGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<PartnersController>(PartnersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

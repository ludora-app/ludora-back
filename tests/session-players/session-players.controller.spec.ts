import { Test, TestingModule } from '@nestjs/testing';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { SessionPlayersController } from 'src/session-players/session-players.controller';
import { SessionPlayersService } from 'src/session-players/session-players.service';

describe('SessionPlayersController', () => {
  let controller: SessionPlayersController;

  // const mockSessionPlayersService = {
  //   addPlayerToSession: jest.fn(),
  // };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionPlayersController],
      // providers: [
      //   {
      //     provide: SessionPlayersService,
      //     useValue: mockSessionPlayersService,
      //   },
      // ],
    })
      .overrideGuard(AuthB2CGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<SessionPlayersController>(SessionPlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

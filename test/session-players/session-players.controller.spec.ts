import { Test, TestingModule } from '@nestjs/testing';
import { SessionPlayersController } from 'src/session-players/session-players.controller';
import { SessionPlayersService } from 'src/session-players/session-players.service';

describe('SessionPlayersController', () => {
  let controller: SessionPlayersController;

  // const mockSessionPlayersService = {
  //   addPlayerToSession: jest.fn(),
  // };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionPlayersController],
      // providers: [
      //   {
      //     provide: SessionPlayersService,
      //     useValue: mockSessionPlayersService,
      //   },
      // ],
    }).compile();

    controller = module.get<SessionPlayersController>(SessionPlayersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GameModePreferencesController } from 'src/user-preferences/controllers/game-mode-preferences.controller';

describe('GameModePreferencesController', () => {
  let controller: GameModePreferencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameModePreferencesController],
    }).compile();

    controller = module.get<GameModePreferencesController>(GameModePreferencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

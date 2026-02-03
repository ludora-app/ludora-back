import { Test, TestingModule } from '@nestjs/testing';
import { GameModePreferencesService } from 'src/user-preferences/services/game-mode-preferences.service';

describe('GameModePreferencesService', () => {
  let service: GameModePreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameModePreferencesService],
    }).compile();

    service = module.get<GameModePreferencesService>(GameModePreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserSportPreferencesController } from './user-sport-preferences.controller';
import { UserSportPreferencesService } from './user-sport-preferences.service';

describe('UserSportPreferencesController', () => {
  let controller: UserSportPreferencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSportPreferencesController],
      providers: [UserSportPreferencesService],
    }).compile();

    controller = module.get<UserSportPreferencesController>(UserSportPreferencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

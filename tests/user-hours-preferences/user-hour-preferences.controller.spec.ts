import { Test, TestingModule } from '@nestjs/testing';
import { UserHourPreferencesController } from '../../src/user-hour-preferences/user-hour-preferences.controller';
import { UserHourPreferencesService } from '../../src/user-hour-preferences/user-hour-preferences.service';

describe('UserHourPreferencesController', () => {
  let controller: UserHourPreferencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserHourPreferencesController],
      providers: [UserHourPreferencesService],
    }).compile();

    controller = module.get<UserHourPreferencesController>(UserHourPreferencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

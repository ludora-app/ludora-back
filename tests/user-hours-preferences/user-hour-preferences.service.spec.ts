import { Test, TestingModule } from '@nestjs/testing';
import { UserHourPreferencesService } from './user-hour-preferences.service';

describe('UserHourPreferencesService', () => {
  let service: UserHourPreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserHourPreferencesService],
    }).compile();

    service = module.get<UserHourPreferencesService>(UserHourPreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

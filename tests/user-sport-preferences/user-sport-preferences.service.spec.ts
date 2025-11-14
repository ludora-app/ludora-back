import { Test, TestingModule } from '@nestjs/testing';
import { UserSportPreferencesService } from './user-sport-preferences.service';

describe('UserSportPreferencesService', () => {
  let service: UserSportPreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSportPreferencesService],
    }).compile();

    service = module.get<UserSportPreferencesService>(UserSportPreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

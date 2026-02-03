import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { UserHourPreferencesService } from './services/user-hour-preferences.service';
import { UserSportPreferencesService } from './services/user-sport-preferences.service';
import { UserHourPreferencesController } from './controllers/user-hour-preferences.controller';
import { UserSportPreferencesController } from './controllers/user-sport-preferences.controller';

@Module({
  controllers: [UserHourPreferencesController, UserSportPreferencesController],
  exports: [UserHourPreferencesService, UserSportPreferencesService],
  imports: [UsersModule, SharedModule],
  providers: [UserHourPreferencesService, UserSportPreferencesService, UsersService],
})
export class UserPreferencesModule {}

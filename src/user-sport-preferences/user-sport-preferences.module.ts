import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { UserSportPreferencesService } from './user-sport-preferences.service';
import { UserSportPreferencesController } from './user-sport-preferences.controller';

@Module({
  controllers: [UserSportPreferencesController],
  imports: [UsersModule, SharedModule],
  providers: [UserSportPreferencesService, UsersService],
})
export class UserSportPreferencesModule {}

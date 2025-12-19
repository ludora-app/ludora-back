import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { UserHourPreferencesService } from './user-hour-preferences.service';
import { UserHourPreferencesController } from './user-hour-preferences.controller';

@Module({
  controllers: [UserHourPreferencesController],
  exports: [UserHourPreferencesService],
  imports: [UsersModule, SharedModule],
  providers: [UserHourPreferencesService, UsersService],
})
export class UserHourPreferencesModule {}

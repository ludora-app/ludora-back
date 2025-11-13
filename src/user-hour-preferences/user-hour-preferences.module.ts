import { Module } from '@nestjs/common';

import { UserHourPreferencesService } from './user-hour-preferences.service';
import { UserHourPreferencesController } from './user-hour-preferences.controller';

@Module({
  controllers: [UserHourPreferencesController],
  providers: [UserHourPreferencesService],
})
export class UserHourPreferencesModule {}

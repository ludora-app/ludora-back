import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { HourPreferencesService } from './services/hour-preferences.service';
import { SportPreferencesService } from './services/sport-preferences.service';
import { HourPreferencesController } from './controllers/hour-preferences.controller';
import { SportPreferencesController } from './controllers/sport-preferences.controller';

@Module({
  controllers: [HourPreferencesController, SportPreferencesController],
  exports: [HourPreferencesService, SportPreferencesService],
  imports: [UsersModule, SharedModule],
  providers: [HourPreferencesService, SportPreferencesService, UsersService],
})
export class UserPreferencesModule {}

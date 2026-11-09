import { Module } from '@nestjs/common';
import { SportsModule } from 'src/sports/sports.module';
import { HourPreferencesController } from './controllers/hour-preferences.controller';
import { SportPreferencesController } from './controllers/sport-preferences.controller';
import { HourPreferencesService } from './services/hour-preferences.service';
import { SportPreferencesService } from './services/sport-preferences.service';

@Module({
  controllers: [HourPreferencesController, SportPreferencesController],
  exports: [HourPreferencesService, SportPreferencesService],
  imports: [SportsModule],
  providers: [HourPreferencesService, SportPreferencesService],
})
export class UserPreferencesModule {}

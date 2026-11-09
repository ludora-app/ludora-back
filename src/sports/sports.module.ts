import { Module } from '@nestjs/common';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  controllers: [SportsController],
  exports: [SportsService],
  providers: [SportsService],
})
export class SportsModule {}

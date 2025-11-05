import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { makeGaugeProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';

import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  controllers: [MetricsController],
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    SharedModule,
  ],
  providers: [
    MetricsService,
    makeGaugeProvider({
      help: 'Number of active users',
      name: 'active_users',
    }),
    UsersService,
  ],
})
export class MetricsModule {}

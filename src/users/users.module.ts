import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { MetricsController } from 'src/shared/metrics/metrics.controller';
import { makeCounterProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [
    SharedModule,
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  providers: [
    UsersService,
    makeCounterProvider({
      help: 'Active users',
      name: 'active_users',
    }),
  ],
})
export class UsersModule {}

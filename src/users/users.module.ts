import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { MetricsController } from 'src/shared/metrics/metrics.controller';
import { makeCounterProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';

import { UsersService } from './application/services/users.service';
import { UsersController } from './presentation/http/users.controller';
import { UsersRepository } from './domain/repositories/users.repository.port';
import { PrismaUserRepository } from './infrastructure/persistance/prisma/prisma-user.repository';

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
    {
      provide: UsersRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UsersModule {}

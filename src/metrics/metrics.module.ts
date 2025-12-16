import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/conversations.service';
import { SessionInvitationsService } from 'src/sessions/services/session-invitations.service';
import {
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';

import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Module({
  controllers: [MetricsController],
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    SharedModule,
    SessionsModule,

    ConversationsModule,
  ],
  providers: [
    MetricsService,
    makeGaugeProvider({
      help: 'Number of active users',
      name: 'active_users',
    }),
    makeGaugeProvider({
      help: 'Number of sessions created within the last 24 hours',
      name: 'sessions_created_last_24_hours',
    }),
    makeGaugeProvider({
      help: 'Number of total pending invitations',
      name: 'total_pending_invitations',
    }),
    makeHistogramProvider({
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // Buckets optimisés pour les percentiles
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      name: 'http_request_duration_seconds',
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
    UsersService,
    SessionsService,
    SessionInvitationsService,
    ConversationsService,
  ],
})
export class MetricsModule {}

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import {
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { FieldsModule } from 'src/fields/fields.module';
import { SessionInvitationsService } from 'src/sessions/services/session-invitations.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { UsersService } from 'src/users/users.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [],
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      // Use our custom controller so we can decorate it with @Public()
      // and to avoid conflicts with the default PrometheusController.
      controller: MetricsController,
      path: '/metrics',
    }),
    ScheduleModule.forRoot(),
    SessionsModule,
    UserPreferencesModule,
    ConversationsModule,
    FieldsModule,
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

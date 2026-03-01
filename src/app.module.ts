import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DevicesModule } from './devices/devices.module';
import { FieldsModule } from './fields/fields.module';
import { FirebaseModule } from './firebase/firebase.module';
import { FriendsModule } from './friends/friends.module';
import { MetricsModule } from './metrics/metrics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PartnersModule } from './partners/partners.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';
import { SharedModule } from './shared/shared.module';
import { UserLifecycleModule } from './user-lifecycle/user-lifecycle.module';
import { UsersModule } from './users/users.module';

const isDevelopment = process.env.NODE_ENV === 'debug' || process.env.NODE_ENV === 'development';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        // Default configuration - applied globally if not overridden
        limit: 100, // Max 100 req/min (normal mobile app usage)
        name: 'default',
        ttl: 60000, // 1 minute
      },
      {
        // Anti-burst protection (requests too fast)
        limit: 10, // Max 10 req/sec
        name: 'short',
        ttl: 1000, // 1 second
      },
      {
        // Medium duration protection (intensive usage)
        limit: 100, // Max 100 req/min
        name: 'medium',
        ttl: 60000, // 1 minute
      },
      {
        // Long duration protection (anti-DDoS)
        limit: 1000, // Max 1000 req/15min
        name: 'long',
        ttl: 900000, // 15 minutes
      },
    ]),
    LoggerModule.forRoot({
      exclude: ['/health', '/metrics', '/swagger', '/swagger/*path'],
      pinoHttp: {
        // Exclude the health check and metrics routes from automatic logging
        autoLogging: {
          ignore: (req: any) => {
            const url = req.raw?.url || req.url || '';
            // Ignore the monitoring routes (health check, metrics, etc.)
            return url.includes('/health') || url.includes('/metrics') || url.includes('/swagger');
          },
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
        },
        customSuccessMessage: (req, res) => {
          return `${req.method} ${req.url} - ${res.statusCode}`;
        },
        // Set log level based on environment
        // debug: show all logs including debug
        // info: show info, warn, error (default)
        level: isDevelopment ? 'debug' : 'info',
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        transport: {
          options: {
            colorize: isDevelopment,
            customColors: 'info:green,warn:bgYellow,error:bgRed,debug:bgMagenta',
            ignore: 'hostname,req,res,responseTime',
            levelFirst: false,
            messageFormat: '{pid}  - {time} {level} [{context}] {msg}',
            translateTime: 'dd/mm/yyyy, h:MM:ss TT',
          },
          target: 'pino-pretty',
        },
      },
    }),
    AuthModule,
    ChatModule,
    ConversationsModule,
    FieldsModule,
    FriendsModule,
    MetricsModule,
    NotificationsModule,
    PartnersModule,
    PaymentModule,
    PrismaModule,
    SessionsModule,
    SharedModule,
    UsersModule,
    FirebaseModule,
    DevicesModule,
    UserLifecycleModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

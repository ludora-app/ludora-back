import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { FieldsModule } from './fields/fields.module';
import { PaymentModule } from './payment/payment.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthB2CModule } from './auth-b2c/auth-b2c.module';
import { AuthB2BModule } from './auth-b2b/auth-b2b.module';
import { SessionsModule } from './sessions/sessions.module';
import { PartnersModule } from './partners/partners.module';
import { ConversationsModule } from './conversations/conversations.module';
import { SessionInvitationsModule } from './session-invitations/session-invitations.module';
import { UserHourPreferencesModule } from './user-hour-preferences/user-hour-preferences.module';
import { UserSportPreferencesModule } from './user-sport-preferences/user-sport-preferences.module';

const isDevelopment = process.env.NODE_ENV === 'debug' || process.env.NODE_ENV === 'development';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        limit: 10, // 10 requests per minute
        ttl: 60000, // 1 minute
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        // Set log level based on environment
        // debug: show all logs including debug
        // info: show info, warn, error (default)
        level: isDevelopment ? 'debug' : 'info',
        // Exclude the health check and metrics routes from automatic logging
        autoLogging: {
          ignore: (req) => {
            const url = req.url || '';
            // Ignore the monitoring routes (health check, metrics, etc.)
            return (
              url === '/health' ||
              url.startsWith('/metrics') ||
              url === '/swagger' ||
              url.startsWith('/swagger/')
            );
          },
        },
        customErrorMessage: (req, res, err) => {
          return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
        },
        customSuccessMessage: (req, res) => {
          return `${req.method} ${req.url} - ${res.statusCode}`;
        },
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
            messageFormat: '{pid}  - {time} {levelLabel} [{context}] {msg}',
            translateTime: 'dd/mm/yyyy, h:MM:ss TT',
          },
          target: 'pino-pretty',
        },
      },
    }),
    SharedModule,
    PrismaModule,
    AuthB2CModule,
    UsersModule,
    SessionsModule,
    SessionInvitationsModule,
    AuthB2BModule,
    PartnersModule,
    PaymentModule,
    MetricsModule,
    UserHourPreferencesModule,
    UserSportPreferencesModule,
    FieldsModule,
    ConversationsModule,
  ],
  providers: [AppService],
})
export class AppModule {}

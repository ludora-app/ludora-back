import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { PaymentModule } from './payment/payment.module';
import { MetricsModule } from './metrics/metrics.module';
import { AuthB2CModule } from './auth-b2c/auth-b2c.module';
import { AuthB2BModule } from './auth-b2b/auth-b2b.module';
import { SessionsModule } from './sessions/sessions.module';
import { PartnersModule } from './partners/partners.module';
import { SessionTeamsModule } from './session-teams/session-teams.module';
import { SessionPlayersModule } from './session-players/session-players.module';
import { SessionInvitationsModule } from './session-invitations/session-invitations.module';

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
        ...(isDevelopment
          ? {
              transport: {
                options: {
                  colorize: true,
                  customColors: 'info:green,warn:bgYellow,error:bgRed,debug:bgMagenta',
                  ignore: 'pid,hostname,context',
                  levelFirst: true,
                  messageFormat: `[{context}] {msg}`,
                  translateTime: 'HH:MM:ss Z',
                },
                target: 'pino-pretty',
              },
            }
          : {}), // In production, no "pretty" transport to keep the JSON raw
      },
    }),
    SharedModule,
    PrismaModule,
    AuthB2CModule,
    UsersModule,
    SessionsModule,
    SessionInvitationsModule,
    SessionTeamsModule,
    SessionPlayersModule,
    AuthB2BModule,
    PartnersModule,
    PaymentModule,
    MetricsModule,
  ],

  providers: [AppService],
})
export class AppModule {}

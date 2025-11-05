import { Module } from '@nestjs/common';
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

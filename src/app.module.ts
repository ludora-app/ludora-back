import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { SessionsModule } from './sessions/sessions.module';
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
    AuthModule,
    UsersModule,
    SessionsModule,
    ScheduleModule.forRoot(),
    SessionInvitationsModule,
  ],

  providers: [AppService],
})
export class AppModule {}

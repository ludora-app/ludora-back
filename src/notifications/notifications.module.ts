import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { NotificationsGateway } from './notifications.gateway';

@Module({
  exports: [NotificationsGateway],
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1d'),
        },
      }),
    }),
  ],
  providers: [NotificationsGateway],
})
export class NotificationsModule {}

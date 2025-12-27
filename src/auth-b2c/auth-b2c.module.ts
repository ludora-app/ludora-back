import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';

import { AuthB2CService } from './auth-b2c.service';
import { AuthB2CGuard } from './guards/auth-b2c.guard';
import { AuthB2CController } from './auth-b2c.controller';
import { WebSocketAuthService } from './websocket-auth.service';

@Module({
  controllers: [AuthB2CController],
  exports: [AuthB2CService, WebSocketAuthService],
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    UsersModule,
    SharedModule,
  ],
  providers: [
    AuthB2CService,
    {
      provide: APP_GUARD,
      useClass: AuthB2CGuard,
    },
    WebSocketAuthService,
  ],
})
export class AuthB2CModule {}

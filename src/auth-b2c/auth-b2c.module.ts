import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { AuthB2CService } from './auth-b2c.service';
import { AuthB2CGuard } from './guards/auth-b2c.guard';
import { AuthB2CController } from './auth-b2c.controller';

@Module({
  controllers: [AuthB2CController],
  exports: [AuthB2CService],
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
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
  ],
  providers: [
    AuthB2CService,
    {
      provide: APP_GUARD,
      useClass: AuthB2CGuard,
    },
  ],
})
export class AuthB2CModule {}

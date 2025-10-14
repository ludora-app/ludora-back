import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  exports: [AuthService],
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
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}

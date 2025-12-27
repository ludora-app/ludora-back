import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PartnersModule } from 'src/partners/partners.module';
import { PartnersService } from 'src/partners/partners.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { AuthB2CGuard } from './guards/auth-b2c.guard';
import { AuthB2CService } from './services/auth-b2c.service';
import { AuthB2BService } from './services/auth-b2b.service';
import { AuthB2CController } from './controllers/auth-b2c.controller';
import { AuthB2BController } from './controllers/auth-b2b.controller';
import { WebSocketAuthService } from './services/websocket-auth.service';

@Module({
  controllers: [AuthB2CController, AuthB2BController],
  exports: [AuthB2CService, WebSocketAuthService, AuthB2BService],
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
    PartnersModule,
  ],
  providers: [
    AuthB2CService,
    {
      provide: APP_GUARD,
      useClass: AuthB2CGuard,
    },
    WebSocketAuthService,
    GeolocalisationService,
    PartnersService,
    AuthB2BService,
  ],
})
export class AuthModule {}

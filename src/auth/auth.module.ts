import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppleModule } from 'src/apple/apple.module';
import { AppleService } from 'src/apple/apple.service';
import { PartnersModule } from 'src/partners/partners.module';
import { PartnersService } from 'src/partners/partners.service';
import { EncryptionService } from 'src/shared/encryption/encryption.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { AuthB2BController } from './controllers/auth-b2b.controller';
import { AuthB2CController } from './controllers/auth-b2c.controller';
import { AuthB2CGuard } from './guards/auth-b2c.guard';
import { AuthB2BService } from './services/auth-b2b.service';
import { AuthB2CService } from './services/auth-b2c.service';
import { WebSocketAuthService } from './services/websocket-auth.service';

@Module({
  controllers: [AuthB2CController, AuthB2BController],
  exports: [AuthB2CService, WebSocketAuthService, AuthB2BService],
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // use get() with a fallback so that NestFactory.create works without .env (e.g. swagger generation)
        secret: configService.get('JWT_SECRET', ''),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PartnersModule,
    AppleModule,
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
    EncryptionService,
    AppleService,
  ],
})
export class AuthModule {}

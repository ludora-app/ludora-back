import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { PartnersModule } from 'src/partners/partners.module';
import { PartnersService } from 'src/partners/partners.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { AuthB2BService } from './auth-b2b.service';
import { AuthB2BController } from './auth-b2b.controller';

@Module({
  controllers: [AuthB2BController],
  imports: [
    UsersModule,
    SharedModule,
    PartnersModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [AuthB2BService, UsersService, GeolocalisationService, PartnersService],
})
export class AuthB2BModule {}

import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User_type } from '@prisma/client';
import { CreateUserDto } from 'src/users/dto';
import { ConfigService } from '@nestjs/config';
import { CreateImageDto } from 'src/auth-b2c/dto';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { PartnersService } from 'src/partners/partners.service';
import { CreatePartnerDto } from 'src/partners/dto/create-partner.dto';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { RegisterB2BDto } from './dto/input/register-b2b.dto';

@Injectable()
export class AuthB2BService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly partnerService: PartnersService,
    private readonly geolocalisationService: GeolocalisationService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private readonly NODE_ENV = this.configService.getOrThrow('NODE_ENV');
  private readonly TOKEN_EXPIRATION_TIME = this.NODE_ENV === 'production' ? '15m' : '1d';

  async register(dto: RegisterB2BDto, createImageDto?: CreateImageDto) {
    const {
      partnerAddress,
      partnerEmail,
      partnerImageUrl,
      partnerName,
      partnerPhone,
      userEmail,
      userFirstname,
      userLastname,
      userPassword,
      userPhone,
    } = dto;

    const existingUser = await this.userService.findOneByEmail(userEmail);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const existingPartner = await this.partnerService.findOneByEmail(partnerEmail);
    if (existingPartner) {
      throw new ConflictException('Partner already exists');
    }

    const hashedPassword = await argon2.hash(userPassword);

    const userDto: CreateUserDto = {
      email: userEmail,
      firstname: userFirstname,
      lastname: userLastname,
      password: hashedPassword,
      phone: userPhone,
      type: User_type.PARTNER,
    };

    const coordinates = await this.geolocalisationService.getLatitudeAndLongitude(partnerAddress);
    const partnerDto: CreatePartnerDto = {
      address: partnerAddress,
      email: partnerEmail,
      imageUrl: partnerImageUrl,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      name: partnerName,
      phone: partnerPhone,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await this.userService.create(userDto, createImageDto, tx);
      const newPartner = await this.partnerService.create(partnerDto, tx);

      const payload: { uid: string; organisationUid: string } = {
        organisationUid: newPartner.uid,
        uid: newUser.uid,
      };
      const accessToken = this.jwt.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_TIME });
      const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

      // Créer le token d'accès
      await tx.userTokens.create({
        data: {
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      // Créer le refresh token
      await tx.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      return { accessToken, newUser, refreshToken };
    });
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }
}

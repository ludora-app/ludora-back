import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserType } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { CreateImageDto, LoginDto } from 'src/auth/dto';
import { CreatePartnerDto } from 'src/partners/dto/input/create-partner.dto';
import { PartnersService } from 'src/partners/partners.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { DateUtils } from 'src/shared/utils/date.utils';
import { CreateUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';

import { RegisterB2BDto } from '../dto/input/register-b2b.dto';

@Injectable()
export class AuthB2BService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly partnerService: PartnersService,
    private readonly geolocalisationService: GeolocalisationService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthB2BService.name);
  }

  private get NODE_ENV(): string {
    return this.configService.getOrThrow('NODE_ENV');
  }

  private get TOKEN_EXPIRATION_TIME() {
    return this.NODE_ENV === 'production' ? '15m' : '1d';
  }

  async register(dto: RegisterB2BDto, createImageDto?: CreateImageDto) {
    const {
      email,
      partnerAddress,
      partnerImageUrl,
      partnerName,
      partnerPhone,
      userFirstname,
      userLastname,
      userPassword,
      userPhone,
    } = dto;

    const existingUser = await this.userService.findOneByEmail(email, USERSELECT.findOneByEmail);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    const existingPartner = await this.partnerService.findOneByEmail(email);
    if (existingPartner) {
      throw new ConflictException('Partner already exists');
    }

    const hashedPassword = await argon2.hash(userPassword);

    const userDto: CreateUserDto = {
      email,
      firstname: userFirstname,
      lastname: userLastname,
      password: hashedPassword,
      phone: userPhone,
      type: UserType.PARTNER,
    };

    const coordinates = await this.geolocalisationService.getLatitudeAndLongitude(partnerAddress);
    const partnerDto: CreatePartnerDto = {
      address: partnerAddress,
      email,
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

      // Create access token
      await tx.userTokens.create({
        data: {
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      // Create refresh token
      await tx.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      return { accessToken, newUser, refreshToken };
    });
    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    const formattedEmail = email.toLowerCase();

    const user = await this.userService.findOneByEmail(formattedEmail, USERSELECT.login);
    if (!user) {
      this.logger.error(`User not found with email ${email}`);
      throw new NotFoundException('User not found');
    }
    if (user.type !== UserType.PARTNER) {
      this.logger.error(`User is not a partner with email ${email} and user uid ${user.uid}`);
      throw new NotFoundException('User not found');
    }
    const partner = await this.partnerService.findOneByEmail(email);
    if (!partner) {
      this.logger.error(`Partner not found with email ${email} and user uid ${user.uid}`);
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = {
      organisationUid: partner.uid,
      uid: user.uid,
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_TIME });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    await this.prisma.$transaction(async (tx) => {
      await tx.userTokens.create({
        data: {
          organisationUid: partner.uid,
          token: accessToken,
          userUid: user.uid,
        },
      });
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          organisationUid: partner.uid,
          token: refreshToken,
          userUid: user.uid,
        },
      });
    });
    return { accessToken, refreshToken };
  }
}

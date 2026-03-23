import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Provider, Users } from 'generated/prisma/browser';
import { UserType } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AppleService } from 'src/apple/apple.service';
import {
  CreateImageDto,
  LoginDto,
  RefreshTokenDto,
  RegisterB2CDto,
  VerifyMailDto,
} from 'src/auth/dto';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenType } from 'src/shared/constants/constants';
import { USERSELECT } from 'src/shared/constants/select-user';
import { EmailsService } from 'src/shared/emails/emails.service';
import { DateUtils } from 'src/shared/utils/date.utils';
import { VerificationCodeUtil } from 'src/shared/utils/verification-code.utils';
import { CreateUserDto } from 'src/users/dto/input/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { UserNameUtils } from 'src/users/utils/user-name.utils';
import { CreateAppleUserDto } from '../dto/input/create-apple-user.dto';
import { CreateGoogleUserDto } from '../dto/input/create-google-user.dto';

@Injectable()
export class AuthB2CService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly emailsService: EmailsService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly appleService: AppleService,
  ) {
    this.logger.setContext(AuthB2CService.name);
  }
  private get NODE_ENV(): string {
    return this.configService.getOrThrow('NODE_ENV');
  }

  private get TOKEN_EXPIRATION_TIME() {
    return this.NODE_ENV === 'production' ? '15m' : '1d';
  }
  private readonly MINIMUM_AGE_DATE = new Date(
    new Date().setFullYear(new Date().getFullYear() - 15),
  );

  async register(
    registerDto: RegisterB2CDto,
    createImageDto?: CreateImageDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { type } = registerDto;

    const result = await this.prismaService.$transaction(async (tx) => {
      let newUser: Pick<Users, 'uid' | 'email' | 'firstname' | 'lastname'> | null;

      if (!DateUtils.isBefore(registerDto.birthdate, this.MINIMUM_AGE_DATE)) {
        this.logger.error(
          `User must be at least 15 years old: ${registerDto.birthdate} > ${this.MINIMUM_AGE_DATE}`,
        );
        throw new BadRequestException('User must be at least 15 years old');
      }

      if (type === UserType.USER) {
        const { bio, birthdate, email, firstname, lastname, password, phone, sex } = registerDto;

        const hashedPassword = await argon2.hash(password);

        const userDto: CreateUserDto = {
          bio,
          birthdate,
          email,
          firstname,
          lastname,
          password: hashedPassword,
          phone,
          sex,
        };

        newUser = await this.userService.create(userDto, createImageDto, tx);
      } else {
        throw new BadRequestException('Invalid user type');
      }

      const payload: { uid: string; type?: 'access' | 'refresh' | 'reset' } = {
        uid: newUser.uid,
      };

      const accessToken = this.jwt.sign(
        { ...payload, type: TokenType.ACCESS },
        { expiresIn: this.TOKEN_EXPIRATION_TIME },
      );
      const refreshToken = this.jwt.sign(
        { ...payload, type: TokenType.REFRESH },
        { expiresIn: '7d' },
      );

      // Create the access token
      await tx.userTokens.create({
        data: {
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      // Create the refresh token
      await tx.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      return { accessToken, newUser, refreshToken };
    });

    await this.sendVerificationEmail(result.newUser.uid, result.newUser.email);

    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  async createOrConnectGoogleUser(
    createGoogleUserDto: CreateGoogleUserDto,
  ): Promise<{ accessToken: string; isNewUser: boolean; refreshToken: string; message: string }> {
    const { email, firstname, imageUrl, lastname } = createGoogleUserDto;
    let isNewUser = true;
    const provider = Provider.GOOGLE;
    try {
      const existingUser = await this.userService.findOneByEmail(email, USERSELECT.findOneByEmail);

      // if the user exists, connect the Google account to the user
      if (existingUser) {
        isNewUser = false;
        const payload = { uid: existingUser.uid };
        const accessToken = this.jwt.sign(
          { ...payload, type: TokenType.ACCESS },
          { expiresIn: this.TOKEN_EXPIRATION_TIME },
        );
        const refreshToken = this.jwt.sign(
          { ...payload, type: TokenType.REFRESH },
          { expiresIn: '7d' },
        );

        await this.prismaService.userTokens.create({
          data: {
            token: accessToken,
            userUid: existingUser.uid,
          },
        });

        await this.prismaService.refreshTokens.create({
          data: {
            expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
            token: refreshToken,
            userUid: existingUser.uid,
          },
        });
        this.logger.debug(`User ${existingUser.uid} connected to Google account`);
        const message = 'User already exists, successfully connected to Google account';

        return { accessToken, isNewUser, message, refreshToken };
      }

      const newUser = await this.prismaService.users.create({
        data: {
          email,
          firstname,
          imageUrl,
          isEmailVerified: true,
          lastname,
          provider,
        },
      });

      const payload = { uid: newUser.uid };
      const accessToken = this.jwt.sign(
        { ...payload, type: TokenType.ACCESS },
        { expiresIn: this.TOKEN_EXPIRATION_TIME },
      );
      const refreshToken = this.jwt.sign(
        { ...payload, type: TokenType.REFRESH },
        { expiresIn: '7d' },
      );

      await this.prismaService.userTokens.create({
        data: {
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      await this.prismaService.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      this.logger.debug(`User ${newUser.uid} created and connected to Google account`);
      const message = 'New user created and connected to Google account';

      return { accessToken, isNewUser, message, refreshToken };
    } catch (error) {
      throw new BadRequestException(`Error creating or connecting Google user: ${error.message}`);
    }
  }

  async createOrConnectAppleUser(
    createAppleUserDto: CreateAppleUserDto,
  ): Promise<{ accessToken: string; isNewUser: boolean; message: string; refreshToken: string }> {
    const { email, fullName, identityToken, authorizationCode, realUserStatus, user } =
      createAppleUserDto;
    let isNewUser = true;
    const provider = Provider.APPLE;

    const appleResult = await this.appleService.processAuthCredential({
      identityToken,
      authorizationCode,
      email,
      realUserStatus,
    });

    try {
      const existingUser = await this.userService.findOneByAppleId(appleResult.appleUserId);

      // if the user exists, connect the Apple account to the user
      if (existingUser) {
        isNewUser = false;
        const payload = { uid: existingUser.uid };
        const accessToken = this.jwt.sign(
          { ...payload, type: TokenType.ACCESS },
          { expiresIn: this.TOKEN_EXPIRATION_TIME },
        );
        const refreshToken = this.jwt.sign(
          { ...payload, type: TokenType.REFRESH },
          { expiresIn: '7d' },
        );

        await this.prismaService.userTokens.create({
          data: {
            token: accessToken,
            userUid: existingUser.uid,
          },
        });

        await this.prismaService.refreshTokens.create({
          data: {
            expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
            token: refreshToken,
            userUid: existingUser.uid,
          },
        });
        this.logger.debug(`User ${existingUser.uid} connected to Apple account`);
        const message = 'User already exists, successfully connected to Apple account';

        return { accessToken, isNewUser, message, refreshToken };
      }

      const userDto: CreateUserDto = {
        email: appleResult.email,
        firstname: fullName?.givenName ?? UserNameUtils.getRandomAdjective(),
        lastname: fullName?.familyName ?? UserNameUtils.getRandomLudoraName(),
        provider,
        appleId: user,
        appleRefreshToken: appleResult.encryptedRefreshToken,
      };

      const newUser = await this.userService.create(userDto);

      const payload = { uid: newUser.uid };
      const accessToken = this.jwt.sign(
        { ...payload, type: TokenType.ACCESS },
        { expiresIn: this.TOKEN_EXPIRATION_TIME },
      );
      const refreshToken = this.jwt.sign(
        { ...payload, type: TokenType.REFRESH },
        { expiresIn: '7d' },
      );

      await this.prismaService.userTokens.create({
        data: {
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      await this.prismaService.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      this.logger.debug(`User ${newUser.uid} created and connected to Apple account`);
      const message = 'New user created and connected to Apple account';

      return { accessToken, isNewUser, message, refreshToken };
    } catch (error) {
      throw new BadRequestException(`Error creating or connecting Apple user: ${error.message}`);
    }
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { email, password } = loginDto;
      const formattedEmail = email.toLowerCase();

      const user = await this.userService.findOneByEmail(formattedEmail, USERSELECT.login);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid credentials');
      }

      const payload = { uid: user.uid };
      const accessToken = this.jwt.sign(
        { ...payload, type: TokenType.ACCESS },
        { expiresIn: this.TOKEN_EXPIRATION_TIME },
      );
      const refreshToken = this.jwt.sign(
        { ...payload, type: TokenType.REFRESH },
        { expiresIn: '1year' },
      );

      // Token management with transaction to ensure atomicity
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.userTokens.create({
          data: {
            token: accessToken,
            userUid: user.uid,
          },
        });

        // Create new refresh token
        await prisma.refreshTokens.create({
          data: {
            expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
            token: refreshToken,
            userUid: user.uid,
          },
        });
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyEmail(emailDto: VerifyMailDto): Promise<boolean> {
    const { email } = emailDto;
    const formattedEmail = email.toLowerCase();
    const user = await this.userService.findOneByEmail(formattedEmail, USERSELECT.findOneByEmail);
    if (!user) {
      return true;
    }

    return false;
  }

  // async validateGoogleUser(googleUser: CreateGoogleUserDto) {
  //   try {
  //     let user = await this.prismaService.users.findUnique({
  //       where: { email: googleUser.email },
  //     });

  //     if (!user) {
  //       user = await this.userService.createGoogleUser(googleUser);
  //     }

  //     const payload = { uid: user.uid };

  //     if (user.provider !== Provider.GOOGLE) {
  //       throw new BadRequestException('User already exists');
  //     }

  //     return { accessToken: this.jwt.sign(payload) };
  //   } catch (error) {
  //     if (error instanceof HttpException) throw error;
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  async googleLogin(uid: string) {
    const user = await this.prismaService.users.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload = { uid: user.uid };
    const token = this.jwt.sign(
      { ...payload, type: TokenType.ACCESS },
      { expiresIn: this.TOKEN_EXPIRATION_TIME },
    );
    return { accessToken: token };
  }

  // Can I return error type here?
  async verifyToken(uid: string): Promise<boolean> {
    const user = await this.prismaService.users.findUnique({ where: { uid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isConnected !== true) {
      throw new UnauthorizedException('User is not active');
    }
    return true;
  }

  /**
   * Send a verification email to the user with a 6 digits verfication code that expires in 15 minutes
   * @param userUid - The uid of the user
   * @param email - The email of the user
   * @memberof UsersService & AuthService
   */
  async sendVerificationEmail(userUid: string, email: string) {
    const verificationCode = VerificationCodeUtil.generateVerificationCode();
    const expiresAt = new Date(Date.now() + DateUtils.FIFTEEN_MINUTES);

    // Use a transaction to ensure atomicity
    await this.prismaService.$transaction(async (tx) => {
      // Delete old verification codes
      await tx.emailVerification.deleteMany({
        where: { userUid: userUid },
      });

      // Create the new code
      await tx.emailVerification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userUid: userUid,
        },
      });
    });

    //! set this property in vault
    const baseUrl = this.configService.get('BASE_URL') ?? 'http://localhost:2424';
    const payload = { code: verificationCode, email };
    const token = this.jwt.sign(payload, { expiresIn: '24h' });
    const link = `${baseUrl}/auth-b2c/verify-email-link?token=${token}`;

    // Send the email outside the transaction
    await this.emailsService.sendEmail({
      data: { link },
      recipients: [email],
      template: 'verificationLink',
    });
  }

  /**
   * Verify the email of the user with the verification code
   * Updates the user entity to set the isEmailVerified flag to true
   * @param code - The code of the user
   */
  async verifyEmailLink(user: Users): Promise<void> {
    // Update user verification status
    await this.prismaService.$transaction([
      this.prismaService.users.update({
        data: { isEmailVerified: true },
        where: { uid: user.uid },
      }),
      // Delete all user verification codes
      this.prismaService.emailVerification.deleteMany({
        where: { userUid: user.uid },
      }),
    ]);

    this.logger.debug(`Emitting email.verified event for user ${user.uid}`);
    this.eventEmitter.emit(EventTypes.EMAIL_VERIFIED, { userUid: user.uid });

    await this.emailsService.sendEmail({
      data: { name: user.firstname },
      recipients: [user.email],
      template: 'emailVerified',
    });
  }

  async resendVerificationCode(userUid: string): Promise<void> {
    const user = await this.prismaService.users.findUnique({
      where: { uid: userUid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.prismaService.emailVerification.deleteMany({
      where: { userUid: userUid },
    });

    // Send a new code
    await this.sendVerificationEmail(userUid, user.email);
  }

  /**
   * Refresh access token using refresh token
   * @param refreshTokenDto - The refresh token data
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify and decode the refresh token
      const payload = await this.jwt.verifyAsync(refreshToken);
      const { uid: userUid } = payload;

      if (!userUid) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      // Verify that the refresh token still exists in the database
      const refreshTokenRecord = await this.prismaService.refreshTokens.findFirst({
        where: {
          expiresAt: {
            gt: new Date(), // Verify that it is not expired
          },
          token: refreshToken,
          userUid: userUid,
        },
      });

      if (!refreshTokenRecord) {
        throw new UnauthorizedException('Refresh token expired or invalid');
      }

      // Verify that the user is still active
      const user = await this.prismaService.users.findUnique({
        select: { isConnected: true, isEmailVerified: true, uid: true },
        where: { uid: userUid },
      });

      if (!user || !user.isConnected) {
        throw new UnauthorizedException('User account disabled');
      }

      // Generate new tokens
      const newPayload = { uid: userUid };
      const newAccessToken = this.jwt.sign(
        { ...newPayload, type: TokenType.ACCESS },
        { expiresIn: this.TOKEN_EXPIRATION_TIME },
      );
      const newRefreshToken = this.jwt.sign(
        { ...newPayload, type: TokenType.REFRESH },
        { expiresIn: '7d' },
      );

      // Update tokens in the database
      await this.prismaService.$transaction(async (tx) => {
        // Delete the old refresh token
        await tx.refreshTokens.delete({
          where: { uid: refreshTokenRecord.uid },
        });

        // Create the new refresh token
        await tx.refreshTokens.create({
          data: {
            expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
            token: newRefreshToken,
            userUid: userUid,
          },
        });

        // Update the access token
        const existingAccessToken = await tx.userTokens.findFirst({
          where: { userUid: userUid },
        });

        if (existingAccessToken) {
          await tx.userTokens.update({
            data: { token: newAccessToken },
            where: { uid: existingAccessToken.uid },
          });
        } else {
          await tx.userTokens.create({
            data: {
              token: newAccessToken,
              userUid: userUid,
            },
          });
        }
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user by invalidating all tokens
   * @param userUid - The user uid
   */
  async logout(userUid: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.userTokens.deleteMany({
        where: { userUid },
      });
      await tx.refreshTokens.deleteMany({
        where: { userUid },
      });
    });
  }

  /**
   * Logout from all devices
   * @param userUid - The user uid
   */
  async logoutAllDevices(userUid: string): Promise<void> {
    await this.logout(userUid);
  }

  /**
   * @description This method is used to generate an access token from a verification code in the password reset workflow
   * @param code - The code to generate the access token from
   * @returns
   */
  async generateAccessTokenFromCode(code: string, email: string): Promise<string> {
    const formattedEmail = email.toLowerCase();
    const user = await this.userService.findOneByEmail(formattedEmail, USERSELECT.findOneByEmail);
    if (!user) {
      this.logger.error(`User email not found`);
      throw new NotFoundException(`User ${email} not found`);
    }

    const today = new Date();
    const existingVerificationCode = await this.prismaService.emailVerification.findFirst({
      where: { code, userUid: user.uid },
    });

    if (!existingVerificationCode) {
      this.logger.error(`Verification code does not belong to user: ${email}`);
      throw new UnauthorizedException('Invalid verification code');
    }

    if (existingVerificationCode.expiresAt < today) {
      this.logger.error(`Verification code expired for user: ${email}`);
      throw new UnauthorizedException('Expired verification code');
    }

    const payload = { uid: user.uid };

    const resetToken = this.jwt.sign(
      { ...payload, type: TokenType.ACCESS },
      { expiresIn: this.TOKEN_EXPIRATION_TIME },
    );

    await this.prismaService.userTokens.create({
      data: {
        token: resetToken,
        userUid: user.uid,
      },
    });

    await this.prismaService.emailVerification.delete({
      where: { uid: existingVerificationCode.uid },
    });

    return resetToken;
  }

  async resetForgottenPassword(
    newPassword: string,
    userUid: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { uid: userUid };
    const accessToken = this.jwt.sign(
      { ...payload, type: TokenType.ACCESS },
      { expiresIn: this.TOKEN_EXPIRATION_TIME },
    );
    const refreshToken = this.jwt.sign(
      { ...payload, type: TokenType.REFRESH },
      { expiresIn: '7d' },
    );

    const updatedUser = await this.prismaService.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { uid: userUid },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await argon2.hash(newPassword);
      const updated = await tx.users.update({
        data: { password: hashedPassword },
        where: { uid: userUid },
      });

      await tx.userTokens.deleteMany({
        where: { userUid: userUid },
      });

      await tx.refreshTokens.deleteMany({
        where: { userUid: userUid },
      });

      await tx.userTokens.create({
        data: { token: accessToken, userUid: userUid },
      });

      await tx.refreshTokens.create({
        data: {
          expiresAt: new Date(Date.now() + DateUtils.SEVEN_DAYS),
          token: refreshToken,
          userUid: userUid,
        },
      });

      return updated;
    });

    await this.emailsService.sendEmail({
      data: { name: updatedUser.firstname },
      recipients: [updatedUser.email],
      template: 'passwordReset',
    });

    this.logger.info(`User ${updatedUser.email} password has been reset successfully`);

    return { accessToken, refreshToken };
  }
}

import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserType } from 'generated/prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { EmailsService } from 'src/shared/emails/emails.service';
import { CreateUserDto } from 'src/users/dto/input/create-user.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateImageDto,
  LoginB2CDto,
  RefreshTokenDto,
  RegisterB2CDto,
  VerifyMailDto,
} from 'src/auth-b2c/dto';

@Injectable()
export class AuthB2CService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly emailsService: EmailsService,
    private readonly configService: ConfigService,
  ) {}
  private readonly NODE_ENV = this.configService.getOrThrow('NODE_ENV');
  private readonly TOKEN_EXPIRATION_TIME = this.NODE_ENV === 'production' ? '15m' : '1d';

  async register(
    registerDto: RegisterB2CDto,
    createImageDto?: CreateImageDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { deviceUid, type } = registerDto;

    const result = await this.prismaService.$transaction(async (tx) => {
      let newUser;

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

      const payload: { uid: string; deviceUid?: string } = { uid: newUser.uid };
      if (deviceUid) payload.deviceUid = deviceUid;

      const accessToken = this.jwt.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_TIME });
      const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

      // Create the access token
      await tx.userTokens.create({
        data: {
          deviceUid,
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      // Create the refresh token
      await tx.refreshTokens.create({
        data: {
          deviceUid,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          token: refreshToken,
          userUid: newUser.uid,
        },
      });

      return { accessToken, newUser, refreshToken };
    });

    await this.sendVerificationEmail(result.newUser.uid, result.newUser.email);

    return { accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  async login(loginB2CDto: LoginB2CDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { deviceUid, email, password } = loginB2CDto;
      const formattedEmail = email.toLowerCase();

      const user = await this.userService.findOneByEmail(formattedEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new NotFoundException('User not found');
      }

      const payload = { uid: user.uid, ...(deviceUid && { deviceUid }) };
      const accessToken = this.jwt.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_TIME });
      const refreshToken = this.jwt.sign(payload, { expiresIn: '1year' });

      // Optimisation: Paralléliser les requêtes DB indépendantes
      const [existingTokens, existingRefreshTokens] = await Promise.all([
        this.prismaService.userTokens.findMany({
          orderBy: { createdAt: 'asc' },
          where: { userUid: user.uid },
        }),
        this.prismaService.refreshTokens.findMany({
          orderBy: { createdAt: 'asc' },
          where: { userUid: user.uid },
        }),
      ]);

      const tokenWithDeviceUid = existingTokens.find((token) => token.deviceUid !== null);
      const tokensWithoutDeviceUid = existingTokens.filter((token) => !token.deviceUid);
      const refreshTokenWithDeviceUid = existingRefreshTokens.find(
        (token) => token.deviceUid !== null,
      );
      const refreshTokensWithoutDeviceUid = existingRefreshTokens.filter(
        (token) => !token.deviceUid,
      );

      // Token management with transaction to ensure atomicity
      await this.prismaService.$transaction(async (prisma) => {
        if (deviceUid) {
          if (tokenWithDeviceUid) {
            // Update existing token with deviceUid
            await prisma.userTokens.update({
              data: { token: accessToken },
              where: { uid: tokenWithDeviceUid.uid },
            });
          } else {
            // Create a new token with deviceUid
            await prisma.userTokens.create({
              data: {
                deviceUid,
                token: accessToken,
                userUid: user.uid,
              },
            });
          }
        } else {
          // Token management without deviceUid
          if (tokensWithoutDeviceUid.length >= 1) {
            // Delete the oldest token without deviceUid
            // Use try/catch to avoid race condition errors
            // If the token has already been deleted by another request, ignore the error
            try {
              await prisma.userTokens.delete({
                where: { uid: tokensWithoutDeviceUid[0].uid },
              });
            } catch {
              // If the token no longer exists (already deleted by another concurrent request),
              // continue without error
              // This can happen during load tests with multiple simultaneous requests
            }
          }

          // Create new token without deviceUid
          await prisma.userTokens.create({
            data: {
              token: accessToken,
              userUid: user.uid,
            },
          });
        }

        if (deviceUid) {
          if (refreshTokenWithDeviceUid) {
            // Update existing refresh token with deviceUid
            await prisma.refreshTokens.update({
              data: {
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                token: refreshToken,
              },
              where: { uid: refreshTokenWithDeviceUid.uid },
            });
          } else {
            // Create a new refresh token with deviceUid
            await prisma.refreshTokens.create({
              data: {
                deviceUid,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                token: refreshToken,
                userUid: user.uid,
              },
            });
          }
        } else {
          // Refresh token management without deviceUid
          if (refreshTokensWithoutDeviceUid.length >= 1) {
            // Delete the oldest refresh token without deviceUid
            // Use try/catch to avoid race condition errors
            try {
              await prisma.refreshTokens.delete({
                where: { uid: refreshTokensWithoutDeviceUid[0].uid },
              });
            } catch {
              // If the token no longer exists (already deleted by another concurrent request),
              // continue without error
              // This can happen during load tests with multiple simultaneous requests
            }
          }

          // Create new refresh token without deviceUid
          await prisma.refreshTokens.create({
            data: {
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              token: refreshToken,
              userUid: user.uid,
            },
          });
        }
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyEmail(emailDto: VerifyMailDto): Promise<boolean> {
    const { email } = emailDto;
    const formattedEmail = email.toLowerCase();
    const user = await this.userService.findOneByEmail(formattedEmail);
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
    const token = this.jwt.sign(payload);
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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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

    // Send the email outside the transaction
    await this.emailsService.sendEmail({
      data: { code: verificationCode },
      recipients: [email],
      template: 'verificationCode',
    });
  }

  /**
   * Verify the email of the user with the verification code
   * @param code - The code of the user
   */
  async verifyEmailCode(userUid: string, code: string): Promise<void> {
    const verification = await this.prismaService.emailVerification.findFirst({
      where: {
        code,
        expiresAt: {
          gt: new Date(), // Check that the code is not expired
        },
        userUid: userUid,
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired code');
    }

    // Update user verification status
    await this.prismaService.$transaction([
      this.prismaService.users.update({
        data: { emailVerified: true },
        where: { uid: userUid },
      }),
      // Delete all user verification codes
      this.prismaService.emailVerification.deleteMany({
        where: { userUid: userUid },
      }),
    ]);
  }

  async resendVerificationCode(userUid: string): Promise<void> {
    const user = await this.prismaService.users.findUnique({
      where: { uid: userUid },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
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
      const { deviceUid, uid: userUid } = payload;

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
        select: { emailVerified: true, isConnected: true, uid: true },
        where: { uid: userUid },
      });

      if (!user || !user.isConnected) {
        throw new UnauthorizedException('User account disabled');
      }

      // Generate new tokens
      const newPayload = { uid: userUid, ...(deviceUid && { deviceUid }) };
      const newAccessToken = this.jwt.sign(newPayload, { expiresIn: this.TOKEN_EXPIRATION_TIME });
      const newRefreshToken = this.jwt.sign(newPayload, { expiresIn: '7d' });

      // Update tokens in the database
      await this.prismaService.$transaction(async (tx) => {
        // Delete the old refresh token
        await tx.refreshTokens.delete({
          where: { uid: refreshTokenRecord.uid },
        });

        // Create the new refresh token
        await tx.refreshTokens.create({
          data: {
            deviceUid,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            token: newRefreshToken,
            userUid: userUid,
          },
        });

        // Update the access token
        const existingAccessToken = await tx.userTokens.findFirst({
          where: { deviceUid: deviceUid || null, userUid: userUid },
        });

        if (existingAccessToken) {
          await tx.userTokens.update({
            data: { token: newAccessToken },
            where: { uid: existingAccessToken.uid },
          });
        } else {
          await tx.userTokens.create({
            data: {
              deviceUid,
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
   * @param deviceUid - Optional device uid for device-specific logout
   */
  async logout(userUid: string, deviceUid?: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      if (deviceUid) {
        // Device-specific logout
        await tx.userTokens.deleteMany({
          where: { deviceUid, userUid },
        });
        await tx.refreshTokens.deleteMany({
          where: { deviceUid, userUid },
        });
      } else {
        // Logout from all devices
        await tx.userTokens.deleteMany({
          where: { userUid },
        });
        await tx.refreshTokens.deleteMany({
          where: { userUid },
        });
      }
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
  async generateAccessTokenFromCode(code: string): Promise<string> {
    const today = new Date();
    const existingVerificationCode = await this.prismaService.emailVerification.findFirst({
      where: { code, expiresAt: { gt: today } },
    });

    if (!existingVerificationCode)
      throw new NotFoundException('Invalid or expired verification code');

    const user = await this.userService.findOne(
      existingVerificationCode.userUid,
      USERSELECT.checkIfUserExists,
    );

    if (!user) throw new NotFoundException('User not found');

    const payload = { uid: user.uid };
    // this
    const accessToken = this.jwt.sign(payload, { expiresIn: this.TOKEN_EXPIRATION_TIME });

    await this.prismaService.userTokens.create({
      data: {
        token: accessToken,
        userUid: user.uid,
      },
    });

    return accessToken;
  }
}

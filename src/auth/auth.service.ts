import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User_type } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateImageDto, LoginDto, RegisterUserDto, VerifyMailDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { CreateUserDto } from 'src/users/dto/input/create-user.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly emailsService: EmailsService,
  ) {}

  async register(registerDto: RegisterUserDto, createImageDto?: CreateImageDto): Promise<string> {
    const { deviceUid, type } = registerDto;

    const result = await this.prismaService.$transaction(async (tx) => {
      let newUser;

      if (type === User_type.USER) {
        const { bio, birthdate, email, firstname, lastname, password, phone, sex } = registerDto;

        const userDto: CreateUserDto = {
          bio,
          birthdate,
          email,
          firstname,
          lastname,
          password,
          phone,
          sex,
        };

        newUser = await this.userService.createUser(userDto, createImageDto, tx);
      } else {
        throw new BadRequestException('Invalid user type');
      }

      const payload: { uid: string; deviceUid?: string } = { uid: newUser.uid };
      if (deviceUid) payload.deviceUid = deviceUid;

      const accessToken = this.jwt.sign(payload);

      await tx.user_tokens.create({
        data: {
          deviceUid,
          token: accessToken,
          userUid: newUser.uid,
        },
      });

      return { accessToken, newUser };
    });

    await this.sendVerificationEmail(result.newUser.uid, result.newUser.email);

    return result.accessToken;
  }

  async login(loginDto: LoginDto): Promise<string> {
    try {
      const { deviceUid, email, password } = loginDto;
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
      const accessToken = this.jwt.sign(payload);

      const existingTokens = await this.prismaService.user_tokens.findMany({
        orderBy: { createdAt: 'asc' },
        where: { userUid: user.uid },
      });

      const tokenWithDeviceUid = existingTokens.find((token) => token.deviceUid !== null);
      const tokensWithoutDeviceUid = existingTokens.filter((token) => !token.deviceUid);

      // Gestion des tokens avec transaction pour garantir l'atomicité
      await this.prismaService.$transaction(async (prisma) => {
        if (deviceUid) {
          if (tokenWithDeviceUid) {
            // Mise à jour du token existant avec deviceUid
            await prisma.user_tokens.update({
              data: { token: accessToken },
              where: { uid: tokenWithDeviceUid.uid },
            });
          } else {
            // Création d'un nouveau token avec deviceUid
            await prisma.user_tokens.create({
              data: {
                deviceUid,
                token: accessToken,
                userUid: user.uid,
              },
            });
          }
        } else {
          // Gestion du token sans deviceUid
          if (tokensWithoutDeviceUid.length >= 1) {
            //? on supprime le token le plus ancien sans deviceUid
            await prisma.user_tokens.delete({
              where: { uid: tokensWithoutDeviceUid[0].uid },
            });
          }

          // Création du nouveau token sans deviceUid
          await prisma.user_tokens.create({
            data: {
              token: accessToken,
              userUid: user.uid,
            },
          });
        }
      });

      return accessToken;
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

  // i can return error type here ?
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

    // Utiliser une transaction pour garantir l'atomicité
    await this.prismaService.$transaction(async (tx) => {
      // Supprimer les anciens codes de vérification
      await tx.email_verification.deleteMany({
        where: { userUid: userUid },
      });

      // Créer le nouveau code
      await tx.email_verification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userUid: userUid,
        },
      });
    });

    // Envoyer l'email en dehors de la transaction
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
    const verification = await this.prismaService.email_verification.findFirst({
      where: {
        code,
        expiresAt: {
          gt: new Date(), // vérifie que le code n'est pas expiré
        },
        userUid: userUid,
      },
    });

    if (!verification) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    // Mise à jour du statut de vérification de l'utilisateur
    await this.prismaService.$transaction([
      this.prismaService.users.update({
        data: { emailVerified: true },
        where: { uid: userUid },
      }),
      // Supprime tous les codes de vérification de l'utilisateur
      this.prismaService.email_verification.deleteMany({
        where: { userUid: userUid },
      }),
    ]);
  }

  async resendVerificationCode(userUid: string): Promise<void> {
    const user = await this.prismaService.users.findUnique({
      where: { uid: userUid },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email déjà vérifié');
    }

    await this.prismaService.email_verification.deleteMany({
      where: { userUid: userUid },
    });

    // Envoyer un nouveau code
    await this.sendVerificationEmail(userUid, user.email);
  }
}

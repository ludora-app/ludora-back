import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { User_type } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailsService } from 'src/shared/emails/emails.service';
import { CreateUserDto } from 'src/users/dto/input/create-user.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoginResponseDto,
  RegisterResponseDto,
  VerifyMailDto,
  RegisterUserDto,
  LoginDto,
  VerifyTokenResponseDto,
  VerifyEmailResponseDto,
  CreateImageDto,
} from 'src/auth/dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly emailsService: EmailsService,
  ) {}

  async register(
    registerDto: RegisterUserDto,
    createImageDto?: CreateImageDto,
  ): Promise<RegisterResponseDto> {
    const { device_id, type } = registerDto;

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

      const payload: { id: string; device_id?: string } = { id: newUser.id };
      if (device_id) payload.device_id = device_id;

      const access_token = this.jwt.sign(payload);

      await tx.user_tokens.create({
        data: {
          device_id,
          token: access_token,
          user_id: newUser.id,
        },
      });

      return { access_token, newUser };
    });

    await this.sendVerificationEmail(result.newUser.id, result.newUser.email);

    return {
      data: { access_token: result.access_token },
      message: 'User created successfully',
      status: 201,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const { device_id, email, password } = loginDto;
      const formattedEmail = email.toLowerCase();

      const user = await this.userService.findOneByEmail(formattedEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new NotFoundException('User not found');
      }

      const payload = { id: user.id, ...(device_id && { device_id }) };
      const access_token = this.jwt.sign(payload);

      const existingTokens = await this.prismaService.user_tokens.findMany({
        orderBy: { created_at: 'asc' },
        where: { user_id: user.id },
      });

      const tokenWithDeviceId = existingTokens.find((token) => token.device_id !== null);
      const tokensWithoutDeviceId = existingTokens.filter((token) => !token.device_id);

      // Gestion des tokens avec transaction pour garantir l'atomicité
      await this.prismaService.$transaction(async (prisma) => {
        if (device_id) {
          if (tokenWithDeviceId) {
            // Mise à jour du token existant avec device_id
            await prisma.user_tokens.update({
              data: { token: access_token },
              where: { id: tokenWithDeviceId.id },
            });
          } else {
            // Création d'un nouveau token avec device_id
            await prisma.user_tokens.create({
              data: {
                device_id,
                token: access_token,
                user_id: user.id,
              },
            });
          }
        } else {
          // Gestion du token sans device_id
          if (tokensWithoutDeviceId.length >= 1) {
            //? on supprime le token le plus ancien sans device_id
            await prisma.user_tokens.delete({
              where: { id: tokensWithoutDeviceId[0].id },
            });
          }

          // Création du nouveau token sans device_id
          await prisma.user_tokens.create({
            data: {
              token: access_token,
              user_id: user.id,
            },
          });
        }
      });

      return { data: { access_token }, message: 'Token created successfully', status: 200 };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyEmail(emailDto: VerifyMailDto): Promise<VerifyEmailResponseDto> {
    const { email } = emailDto;
    const formattedEmail = email.toLowerCase();
    const user = await this.userService.findOneByEmail(formattedEmail);
    if (!user) {
      return {
        data: { isAvailable: true },
        message: `Email is available to use`,
      };
    }

    return {
      data: { isAvailable: false },
      message: `Email is already used`,
    };
  }

  // async validateGoogleUser(googleUser: CreateGoogleUserDto) {
  //   try {
  //     let user = await this.prismaService.users.findUnique({
  //       where: { email: googleUser.email },
  //     });

  //     if (!user) {
  //       user = await this.userService.createGoogleUser(googleUser);
  //     }

  //     const payload = { id: user.id };

  //     if (user.provider !== Provider.GOOGLE) {
  //       throw new BadRequestException('User already exists');
  //     }

  //     return { access_token: this.jwt.sign(payload) };
  //   } catch (error) {
  //     if (error instanceof HttpException) throw error;
  //     throw new InternalServerErrorException(error.message);
  //   }
  // }

  async googleLogin(id: string) {
    const user = await this.prismaService.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload = { id: user.id };
    const token = this.jwt.sign(payload);
    return { access_token: token };
  }

  // i can return error type here ?
  async verifyToken(id: string): Promise<VerifyTokenResponseDto> {
    const user = await this.prismaService.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.is_connected !== true) {
      throw new UnauthorizedException('User is not active');
    }
    return { data: { isValid: true }, message: 'token is valid' };
  }

  /**
   * Send a verification email to the user with a 6 digits verfication code that expires in 15 minutes
   * @param userId - The id of the user
   * @param email - The email of the user
   * @memberof UsersService & AuthService
   */
  async sendVerificationEmail(userId: string, email: string) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Utiliser une transaction pour garantir l'atomicité
    await this.prismaService.$transaction(async (tx) => {
      // Supprimer les anciens codes de vérification
      await tx.email_verification.deleteMany({
        where: { user_id: userId },
      });

      // Créer le nouveau code
      await tx.email_verification.create({
        data: {
          code: verificationCode,
          expires_at,
          user_id: userId,
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
  async verifyEmailFromCode(code: string) {
    const verification = await this.prismaService.email_verification.findFirst({
      include: { user: true },
      where: { code },
    });

    if (!verification || verification.expires_at < new Date()) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    await this.prismaService.$transaction([
      this.prismaService.users.update({
        data: { email_verified: true },
        where: { id: verification.user_id },
      }),
      this.prismaService.email_verification.delete({
        where: { id: verification.id },
      }),
    ]);

    return { message: 'Email vérifié avec succès' };
  }

  async verifyEmailCode(userId: string, code: string) {
    const verification = await this.prismaService.email_verification.findFirst({
      where: {
        code,
        expires_at: {
          gt: new Date(), // vérifie que le code n'est pas expiré
        },
        user_id: userId,
      },
    });

    if (!verification) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    // Mise à jour du statut de vérification de l'utilisateur
    await this.prismaService.$transaction([
      this.prismaService.users.update({
        data: { email_verified: true },
        where: { id: userId },
      }),
      // Supprime tous les codes de vérification de l'utilisateur
      this.prismaService.email_verification.deleteMany({
        where: { user_id: userId },
      }),
    ]);

    return {
      message: 'Email vérifié avec succès',
      status: 200,
    };
  }

  async resendVerificationCode(userId: string) {
    const user = await this.prismaService.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.email_verified) {
      throw new BadRequestException('Email déjà vérifié');
    }

    await this.prismaService.email_verification.deleteMany({
      where: { user_id: userId },
    });

    // Envoyer un nouveau code
    await this.sendVerificationEmail(userId, user.email);

    return {
      message: 'Nouveau code de vérification envoyé',
      status: 200,
    };
  }
}

import * as argon2 from 'argon2';
import { PinoLogger } from 'nestjs-pino';
import { CreateImageDto } from 'src/auth/dto';
import { Users } from 'generated/prisma/client';
import { DateUtils } from 'src/shared/utils/date.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Provider } from 'generated/prisma/browser';
import { EmailsService } from 'src/shared/emails/emails.service';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { VerificationCodeUtil } from 'src/shared/utils/verification-code.utils';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { USERSELECT } from '../shared/constants/select-user';
import {
  CreateUserDto,
  FindAllUsersResponseDataDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserFilterDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly storageService: StorageService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async create(
    createUserDto: CreateUserDto,
    createImageDto?: CreateImageDto,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;

    const { email, firstname, lastname } = createUserDto;
    const formattedFirst = firstname.charAt(0).toUpperCase() + firstname.slice(1);
    const formattedLast = lastname.toUpperCase();
    const formattedEmail = email.toLowerCase();
    const formattedBirthdate = createUserDto.birthdate ? new Date(createUserDto.birthdate) : null;

    const existingUser = await prisma.users.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    let imageUrl = { data: '' };

    if (createImageDto) {
      imageUrl = await this.storageService.upload(
        StorageFolderName.USERS,
        createImageDto.name,
        createImageDto.file,
      );
    }

    const newUser = await prisma.users.create({
      data: {
        bio: createUserDto.bio,
        birthdate: formattedBirthdate,
        email: formattedEmail,
        firstname: formattedFirst,
        imageUrl: imageUrl.data,
        lastname: formattedLast,
        password: createUserDto.password,
        phone: createUserDto.phone,
        sex: createUserDto.sex,
        ...(createUserDto.type && { type: createUserDto.type }),
      },
    });

    return newUser;
  }

  async findAll(filters: UserFilterDto): Promise<PaginatedDataDto<FindAllUsersResponseDataDto>> {
    const { cursor, limit, name } = filters;

    const query = {
      select: {
        email: true,
        firstname: true,
        imageUrl: true,
        lastname: true,
        uid: true,
        userSports: {
          select: {
            sport: true,
          },
        },
      },
    };

    if (name) {
      query['where'] = {
        OR: [
          { firstname: { contains: name, mode: 'insensitive' } },
          { lastname: { contains: name, mode: 'insensitive' } },
        ],
      };
    }

    if (limit) {
      query['take'] = limit + 1;
    }

    if (cursor) {
      query['cursor'] = cursor;
    }

    const users = await this.prismaService.users.findMany(query);

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem.uid;
    }

    const totalCount = await this.prismaService.users.count();

    return {
      items: users,
      nextCursor,
      totalCount,
    };
  }

  async findOne(uid: string, select: Prisma.UsersSelect): Promise<Users> {
    const existingUser = await this.prismaService.users.findUnique({
      select: {
        ...select,
      },
      where: { uid },
    });

    if (!existingUser) {
      return null;
    }

    return existingUser;
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @description This method is used in the auth service to find a user by email
   * @returns The user
   */
  async findOneByEmail(email: string, select?: Prisma.UsersSelect): Promise<Users> {
    const user = await this.prismaService.users.findUnique({
      select: select ?? USERSELECT.checkIfUserExistsByEmail,
      where: { email },
    });

    if (!user) return null;

    return user;
  }

  async findOneByStripeAccountId(stripeAccountId: string): Promise<{ stripeAccountId: string }> {
    return await this.prismaService.users.findUnique({
      select: { stripeAccountId: true },
      where: { stripeAccountId },
    });
  }

  /**
   * The function `addStripeAccountId` updates a user's Stripe account ID.
   * @param {string} uid - The `uid` parameter in the `addStripeAccountId` function is a string that
   * represents the unique identifier of a user. It is used to identify the user whose Stripe account ID
   * is being updated in the database.
   * @param {string} stripeAccountId - The `stripeAccountId` parameter is a string that represents the
   * unique identifier for a user's Stripe account. This identifier is used to associate the user with
   * their Stripe account for processing payments and managing transactions.
   */
  async addStripeAccountId(uid: string, stripeAccountId: string): Promise<void> {
    await this.prismaService.users.update({
      data: { stripeAccountId },
      where: { uid },
    });
  }

  async removeStripeAccountId(uid: string): Promise<void> {
    await this.prismaService.users.update({
      data: { stripeAccountId: null },
      where: { uid },
    });
  }

  async update(
    uid: string,
    updateUserDto: UpdateUserDto,
    createImageDto?: CreateImageDto,
  ): Promise<void> {
    const existingUser = await this.findOne(uid, USERSELECT.findMe);

    if (!existingUser) throw new NotFoundException('User not found');
    let imageUrl = existingUser.imageUrl;
    if (createImageDto) {
      const uploadResult = await this.storageService.upload(
        StorageFolderName.USERS,
        createImageDto.name,
        createImageDto.file,
      );
      imageUrl = uploadResult.data;
    }

    const updatedUser = await this.prismaService.users.update({
      data: {
        ...updateUserDto,
        imageUrl: imageUrl,
      },
      where: { uid },
    });

    if (!updatedUser) {
      throw new BadRequestException('User not updated');
    }
    this.logger.debug('User updated successfully');
    return;
  }

  /**
   * @description This method is used to update the password of a user
   * @param uid
   * @param updatePasswordDto
   * @returns
   */
  async updatePassword(uid: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { newPassword, oldPassword } = updatePasswordDto;
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    if (existingUser.provider !== Provider.LUDORA) {
      throw new BadRequestException('Only LUDORA users can update their password');
    }

    const isPasswordValid = await argon2.verify(existingUser.password, oldPassword);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const hashedPassword = await argon2.hash(newPassword);

    const updatedUser = await this.prismaService.users.update({
      data: {
        password: hashedPassword,
      },
      where: { uid },
    });

    if (updatedUser) {
      await this.emailsService.sendEmail({
        data: { name: updatedUser.firstname },
        recipients: [updatedUser.email],
        template: 'passwordReset',
      });
      return;
    } else {
      throw new BadRequestException('User not updated');
    }
  }

  async updateEmail(uid: string, email: string): Promise<void> {
    const existingUser = await this.findOne(uid, USERSELECT.checkIfUserExistsByEmail);
    if (!existingUser) throw new NotFoundException('User not found');

    const existingUserWithEmail = await this.findOneByEmail(
      email,
      USERSELECT.checkIfUserExistsByEmail,
    );
    if (existingUserWithEmail) throw new ConflictException('Email already exists');

    await this.prismaService.users.update({
      data: { email },
      where: { uid },
    });
  }

  async deactivate(uid: string): Promise<void> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    await this.prismaService.users.update({
      data: {
        isConnected: false,
      },
      where: { uid },
    });

    return;
  }

  async remove(uid: string): Promise<void> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    await this.prismaService.users.delete({
      where: { uid },
    });

    return;
  }

  /**
   * Send a verification email to the user with a 6 digits verfication code that expires in 15 minutes
   * @param userUid - The uid of the user
   * @param email - The email of the user
   * @memberof UsersService & AuthService
   */
  async sendVerificationEmail(userUid: string, email: string) {
    const verificationCode = VerificationCodeUtil.generateVerificationCode();
    const expiresAt = new Date(Date.now() + DateUtils.FIFTEEN_MINUTES); // 15 minutes

    // Utiliser une transaction pour garantir l'atomicité
    await this.prismaService.$transaction(async (tx) => {
      // Supprimer les anciens codes de vérification
      await tx.emailVerification.deleteMany({
        where: { userUid: userUid },
      });

      // Créer le nouveau code
      await tx.emailVerification.create({
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
      template: 'verificationLink',
    });
  }

  /**
   * This async function returns the count of active users who are connected.
   * @returns The `getActiveUsersCount` function returns a Promise that resolves to a number, which
   * represents the count of users where the `isConnected` property is true in the database.
   * @description This method is used in the metrics service to get the count of active users.
   */
  async getActiveUsersCount(): Promise<number> {
    return await this.prismaService.users.count({
      where: {
        isConnected: true,
      },
    });
  }

  /**   * @param user - The user
   * @description This method is used to send a verification code for password reset to the user
   */
  async sendCodeForPasswordReset(
    user: Pick<
      Users,
      'uid' | 'email' | 'firstname' | 'lastname' | 'imageUrl' | 'provider' | 'isEmailVerified'
    >,
  ): Promise<void> {
    const verificationCode = VerificationCodeUtil.generateVerificationCode();
    this.logger.debug('verificationCode', verificationCode);
    const expiresAt = new Date(Date.now() + DateUtils.FIFTEEN_MINUTES);

    await this.prismaService.$transaction(async (tx) => {
      // Delete old verification codes
      await tx.emailVerification.deleteMany({
        where: { userUid: user.uid },
      });

      // Create the new code
      await tx.emailVerification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userUid: user.uid,
        },
      });
    });

    await this.emailsService.sendEmail({
      data: { code: verificationCode, name: user.firstname },
      recipients: [user.email],
      template: 'passwordResetRequest',
    });
  }
  /**
   *
   * @param email - The email of the user
   * @description This method is used to send a verification code for password reset to the user email
   */
  async sendCodeForPasswordResetRequest(email: string): Promise<void> {
    const user = await this.findOneByEmail(email, USERSELECT.findOneByEmail);

    if (!user) {
      this.logger.error(`User not found for email: ${email}`);
      return;
    }

    if (user.provider === 'GOOGLE') {
      this.logger.error(`User is a Google user, cannot send password reset code`);
      return;
    }

    await this.sendCodeForPasswordReset(user);
  }
}

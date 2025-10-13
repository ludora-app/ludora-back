import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Users } from '@prisma/client';
import * as argon2 from 'argon2';
import { CreateImageDto } from 'src/auth/dto';
import { SuccessTypeDto } from 'src/interfaces/success-type';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3FoldersName } from 'src/shared/constants/constants';
import { EmailsService } from 'src/shared/emails/emails.service';
import { ImagesService } from 'src/shared/images/images.service';

import { USERSELECT } from '../shared/constants/select-user';
import { CreateUserDto, UpdatePasswordDto, UpdateUserDto, UserFilterDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly imageService: ImagesService,
    private readonly emailsService: EmailsService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    createImageDto?: CreateImageDto,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService;

    const { email, firstname, lastname, password } = createUserDto;
    const formattedFirst = firstname.charAt(0).toUpperCase() + firstname.slice(1);
    const formattedLast = lastname.charAt(0).toUpperCase() + lastname.slice(1);
    const formattedEmail = email.toLowerCase();

    const existingUser = await prisma.users.findUnique({
      where: { email: formattedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await argon2.hash(password);

    let imageUrl = { data: '' };

    if (createImageDto) {
      imageUrl = await this.imageService.create(S3FoldersName.USERS, createImageDto);
    }

    const newUser = await prisma.users.create({
      data: {
        bio: createUserDto.bio,
        birthdate: new Date(createUserDto.birthdate),
        email: formattedEmail,
        firstname: formattedFirst,
        imageUrl: imageUrl.data,
        lastname: formattedLast,
        password: hashedPassword,
        phone: createUserDto.phone,
        sex: createUserDto.sex,
      },
    });

    return newUser;
  }

  async findAll(filters: UserFilterDto): Promise<{
    items: any[];
    nextCursor: string | null;
    totalCount: number;
  }> {
    const { cursor, limit, name } = filters;

    const query = {
      select: {
        email: true,
        firstname: true,
        uid: true,
        imageUrl: true,
        lastname: true,
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
      select,
      where: { uid },
    });

    let imageUrl = await this.imageService.getProfilePic(existingUser.uid);
    if (!imageUrl) {
      imageUrl = '';
    }
    const user = { ...existingUser, imageUrl };
    return user;
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @description This method is used in the auth service to find a user by email
   * @returns The user
   */
  async findOneByEmail(email: string): Promise<Users> {
    return await this.prismaService.users.findUnique({
      where: { email },
    });
  }

  async update(uid: string, updateUserDto: UpdateUserDto): Promise<Users> {
    const existingUser = await this.findOne(uid, USERSELECT.findMe);

    if (!existingUser) throw new NotFoundException('User not found');

    const updatedUser = await this.prismaService.users.update({
      data: {
        ...updateUserDto,
      },
      where: { uid },
    });

    if (updatedUser) {
      return updatedUser;
    } else {
      throw new BadRequestException('User not updated');
    }
  }

  //? this method needs to change the password after all the verification is done
  //todo: new method that send the verification email ? And verify if the user.provider is google ?
  async updatePassword(uid: string, updatePasswordDto: UpdatePasswordDto): Promise<SuccessTypeDto> {
    const { newPassword, oldPassword } = updatePasswordDto;
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

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
      return { message: 'User password updated successfully', status: 200 };
    } else {
      throw new BadRequestException('User not updated');
    }
  }

  async deactivate(uid: string): Promise<SuccessTypeDto> {
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

    return { message: `User ${uid} has been deactivated`, status: 200 };
  }

  async remove(uid: string): Promise<SuccessTypeDto> {
    const existingUser = await this.prismaService.users.findUnique({
      where: { uid },
    });

    if (!existingUser) throw new NotFoundException('User not found');

    await this.prismaService.users.delete({
      where: { uid },
    });

    return { message: `User ${uid} has been deleted`, status: 200 };
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
      template: 'verificationCode',
    });
  }
}

import { Injectable } from '@nestjs/common';
import { User } from 'src/users/domain/entities/user';
import { PrismaService } from 'src/prisma/prisma.service';
// import { UserFilterDto } from 'src/users/presentation/dtos/input/user-filter.dto';
// import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import { UsersRepository } from 'src/users/domain/repositories/users.repository.port';
import { UserNotFoundDomainError } from 'src/users/domain/errors/user-not-found.error';

import { PrismaUserMapper } from './prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const prismaUser = PrismaUserMapper.toPrisma(user);
    await this.prisma.users.create({
      data: prismaUser,
    });
    console.log('prismaUser from repository', prismaUser);
    return;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundDomainError(id);
    }

    return PrismaUserMapper.toDomain(user);
  }

  //   update(id: string, user: User): Promise<void> {
  //     return this.prisma.users.update({
  //       data: user,
  //       where: { id },
  //     });
  //   }

  //   findByEmail(email: string): Promise<User | null> {
  //     return this.prisma.users.findUnique({
  //       where: { email },
  //     });
  //   }

  //   findAll(filters: UserFilterDto): Promise<PaginationResponseTypeDto<User>> {
  //     return this.prisma.users.findMany({
  //       where: filters,
  //     });
  //   }
}

import { Injectable } from '@nestjs/common';
import { User } from 'src/users/domain/entities/user';
import { PrismaService } from 'src/prisma/prisma.service';
// import { UserFilterDto } from 'src/users/presentation/dtos/input/user-filter.dto';
// import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import { UserFilter } from 'src/users/domain/value-objects/user-filter';
import { PaginationResponseType } from 'src/interfaces/pagination-response-type';
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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundDomainError(email);
    }
    return PrismaUserMapper.toDomain(user);
  }

  async findAll(filters: UserFilter): Promise<PaginationResponseType<User>> {
    const { cursor, limit, name } = filters;
    console.log('filters', filters);

    const query = {};

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

    const users = await this.prisma.users.findMany(query);

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem!.id;
    }

    const usersMapped = users.map((user) => PrismaUserMapper.toDomain(user));

    return {
      data: {
        items: usersMapped,
        nextCursor,
        totalCount: usersMapped.length,
      },
    };
  }
}

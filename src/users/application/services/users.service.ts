import { Injectable } from '@nestjs/common';
import { Phone } from 'src/users/domain/value-objects/phone';
import { Email } from 'src/users/domain/value-objects/email';
import { UserId } from 'src/users/domain/value-objects/user-id';
// import { UserFilterDto } from 'src/users/presentation/dtos/input/user-filter.dto';
// import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import { UserFilter } from 'src/users/application/queries/user-filter';
import { PaginationResponseType } from 'src/interfaces/pagination-response-type';
import { UsersRepository } from 'src/users/domain/repositories/users.repository';

import { User } from '../../domain/entities/user';
import { CreateUserCommand } from '../commands/create-user.command';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  save(command: CreateUserCommand) {
    const user = User.create({
      bio: command.bio,
      birthdate: new Date(command.birthdate),
      email: new Email(command.email),
      firstname: command.firstname,
      id: UserId.generate(),
      imageUrl: command.imageUrl,
      lastname: command.lastname,
      password: command.password,
      phone: new Phone(command.phone),
      provider: command.provider,
      sex: command.sex,
      type: command.type,
    });
    return this.usersRepository.save(user);
  }
  findById(id: string): Promise<User> {
    return this.usersRepository.findById(id);
  }
  update(id: string, user: User): Promise<void> {
    return this.usersRepository.update(id, user);
  }
  // existsByEmail(email: string): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }
  findAll(filters: UserFilter): Promise<PaginationResponseType<User>> {
    return this.usersRepository.findAll(filters);
  }
}

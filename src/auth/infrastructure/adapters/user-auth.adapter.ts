import { Sex } from 'src/users/domain/value-objects/sex';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';
import { UserAuthInfo } from 'src/auth/domain/entities/user-auth-info';
import { UsersService } from 'src/users/application/services/users.service';
import { LoginCredentials } from 'src/auth/domain/entities/login-credentials';
import { RegisterCredentials } from 'src/auth/domain/entities/register-credentials';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';
import { CreateUserCommand } from 'src/users/application/commands/create-user.command';
import { ArgonPasswordHasherService } from 'src/shared/infrastructure/services/argon-password-hasher.service';

import { UserAuthMapper } from '../mappers/user-auth.mapper';

@Injectable()
export class UserAuthAdapter implements UserAuthRepository {
  constructor(
    private readonly userService: UsersService,
    private readonly argon2: ArgonPasswordHasherService,
  ) {}

  async validateUser(credentials: LoginCredentials): Promise<UserAuthInfo | null> {
    const user = await this.userService.findByEmail(credentials.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    console.log('HASH:', user.getPassword());
    console.log('PLAIN:', credentials.password);
    const isValid = await this.argon2.compare(user.getPassword(), credentials.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');
    return new UserAuthInfo(
      user.getId().toString(),
      user.getEmail(),
      user.getIsConnected(),
      user.isEmailVerified(),
    );
  }

  async registerUser(credentials: RegisterCredentials): Promise<UserAuthInfo> {
    const user = await this.userService.save(
      CreateUserCommand.create(
        credentials.firstname,
        credentials.email,
        credentials.lastname,
        await this.argon2.hash(credentials.password),
        credentials.birthdate,
        credentials.phone,
        credentials.type as UserType,
        credentials.sex as Sex,
        credentials.imageUrl,
        credentials.bio,
        credentials.provider as Provider,
      ),
    );
    return UserAuthMapper.toDomain(user);
  }

  async findUserById(id: string): Promise<UserAuthInfo | null> {
    const user = await this.userService.findById(id);
    if (!user) return null;
    return new UserAuthInfo(
      user.getId().toString(),
      user.getEmail(),
      user.getIsConnected(),
      user.isEmailVerified(),
    );
  }
}

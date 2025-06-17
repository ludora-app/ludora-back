import { Sex } from 'src/users/domain/value-objects/sex';
import { Email } from 'src/users/domain/value-objects/email';
import { Phone } from 'src/users/domain/value-objects/phone';
import { UserId } from 'src/users/domain/value-objects/user-id';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';
import { PaginationResponseType } from 'src/interfaces/pagination-response-type';

import { UserDto } from '../dtos/user.dto';
import { User } from '../../domain/entities/user';
import { FindAllUsersResponseDtoType } from '../dtos/output/find-all-users-response.dto';
import {
  FindMeUserResponseDataDto,
  FindOneUserResponseDataDto,
} from '../dtos/output/find-one-user-response.dto';

export class UserPresentationMapper {
  static toPresentation(user: User): UserDto {
    return {
      bio: user.getProfile().bio,
      birthdate: user.getBirthdate().toISOString(),
      createdAt: user.getCreatedAt().toISOString(),
      email: user.getEmail(),
      emailVerified: user.isEmailVerified(),
      firstname: user.getProfile().firstname,
      id: user.getId(),
      imageUrl: user.getProfile().imageUrl,
      isConnected: user.getIsConnected(),
      lastname: user.getProfile().lastname,
      password: user.getPassword(),
      phone: user.getPhone(),
      provider: user.getProvider(),
      sex: user.getSex(),
      stripeAccountId: user.getStripeAccountId(),
      type: user.getType(),
      updatedAt: user.getUpdatedAt().toISOString(),
    };
  }

  static toDomain(user: UserDto): User {
    return User.create({
      bio: user.bio,
      birthdate: new Date(user.birthdate),
      email: new Email(user.email),
      firstname: user.firstname,
      id: UserId.fromString(user.id),
      imageUrl: user.imageUrl,
      lastname: user.lastname,
      password: user.password,
      phone: new Phone(user.phone),
      provider: user.provider as Provider,
      sex: user.sex as Sex,
      type: user.type as UserType,
    });
  }

  static toFindOneUserResponse(user: User): FindOneUserResponseDataDto {
    return {
      email: user.getEmail(),
      firstname: user.getProfile().firstname,
      id: user.getId(),
      imageUrl: user.getProfile().imageUrl,
      lastname: user.getProfile().lastname,
      name: `${user.getProfile().firstname} ${user.getProfile().lastname}`,
    };
  }

  static toFindMeUserResponse(user: User): FindMeUserResponseDataDto {
    return {
      email: user.getEmail(),
      firstname: user.getProfile().firstname,
      id: user.getId(),
      imageUrl: user?.getProfile().imageUrl ?? '',
      lastname: user?.getProfile().lastname ?? '',
      phone: user?.getPhone() ?? '',
      stripeAccountId: user?.getStripeAccountId() ?? '',
    };
  }

  static toFindAllUsersResponse(users: PaginationResponseType<User>): FindAllUsersResponseDtoType {
    return {
      data: {
        items: users.data.items.map((user) => this.toFindOneUserResponse(user)),
        nextCursor: users.data.nextCursor,
        totalCount: users.data.totalCount,
      },
      message: users.message ?? 'Users fetched successfully',
      status: users.status ?? 200,
    };
  }
}

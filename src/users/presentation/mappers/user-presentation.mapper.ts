import { Sex } from 'src/users/domain/value-objects/sex';
import { Email } from 'src/users/domain/value-objects/email';
import { Phone } from 'src/users/domain/value-objects/phone';
import { UserId } from 'src/users/domain/value-objects/user-id';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';

import { UserDto } from '../dtos/user.dto';
import { User } from '../../domain/entities/user';

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
}

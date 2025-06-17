import { Users as PrismaUser } from '@prisma/client';
import { User } from 'src/users/domain/entities/user';
import { Sex } from 'src/users/domain/value-objects/sex';
import { Email } from 'src/users/domain/value-objects/email';
import { Phone } from 'src/users/domain/value-objects/phone';
import { UserId } from 'src/users/domain/value-objects/user-id';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';

export class PrismaUserMapper {
  static toPrisma(user: User): PrismaUser {
    return {
      bio: user.getProfile().bio,
      birthdate: user.getBirthdate(),
      createdAt: user.getCreatedAt(),
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
      updatedAt: user.getUpdatedAt(),
    };
  }

  static toDomain(user: PrismaUser): User {
    return User.create({
      bio: user.bio,
      birthdate: user.birthdate,
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

  static toPartialDomain(user: Partial<PrismaUser>): Partial<User> {
    return {
      bio: user.bio,
      birthdate: user.birthdate ? new Date(user.birthdate) : undefined,
      createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      email: user.email ? new Email(user.email) : undefined,
      emailVerified: user.emailVerified,
      firstname: user.firstname,
      id: user.id ? UserId.fromString(user.id).getValue() : undefined,
      imageUrl: user.imageUrl,
      isConnected: user.isConnected,
      lastname: user.lastname,
      password: user.password,
      phone: user.phone ? new Phone(user.phone) : undefined,
      provider: user.provider as Provider,
      sex: user.sex as Sex,
      stripeAccountId: user.stripeAccountId,
      type: user.type as UserType,
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    } as Partial<User>;
  }
}

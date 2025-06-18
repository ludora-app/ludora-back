import { Sex } from 'src/users/domain/value-objects/sex';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';

export class CreateUserCommand {
  private constructor(
    public readonly firstname: string,
    public readonly email: string,
    public readonly lastname?: string,
    public readonly password?: string,
    public readonly birthdate?: string,
    public readonly phone?: string,
    public readonly type?: UserType,
    public readonly sex?: Sex,
    public readonly imageUrl?: string,
    public readonly bio?: string,
    public readonly provider?: Provider,
  ) {}

  static create(
    firstname: string,
    email: string,
    lastname?: string,
    password?: string,
    birthdate?: string,
    phone?: string,
    type?: UserType,
    sex?: Sex,
    imageUrl?: string,
    bio?: string,
    provider?: Provider,
  ): CreateUserCommand {
    return new CreateUserCommand(
      firstname.charAt(0).toUpperCase() + firstname.slice(1),
      email.toLowerCase(),
      lastname ? lastname.charAt(0).toUpperCase() + lastname.slice(1) : undefined,
      password,
      birthdate,
      phone,
      type,
      sex,
      imageUrl,
      bio,
      provider,
    );
  }
}

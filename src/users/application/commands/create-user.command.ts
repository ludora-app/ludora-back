import { Sex } from 'src/users/domain/value-objects/sex';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';

export class CreateUserCommand {
  constructor(
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
}

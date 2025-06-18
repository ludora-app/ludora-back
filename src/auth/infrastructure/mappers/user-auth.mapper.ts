import { User } from 'src/users/domain/entities/user';
import { UserAuthInfo } from 'src/auth/domain/entities/user-auth-info';

export class UserAuthMapper {
  static toDomain(user: User): UserAuthInfo {
    return new UserAuthInfo(
      user.getId().toString(),
      user.getEmail().toString(),
      user.getIsConnected(),
      user.isEmailVerified(),
    );
  }
}

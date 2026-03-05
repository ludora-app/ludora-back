import { UserSimpleDisplayWithUidData } from 'src/users/dto';

interface BlockedUser {
  blocked: {
    firstname: string;
    imageUrl: string;
    lastname: string;
    uid: string;
  };
}

export class BlockedUsersMapper {
  static toDto(blockedUser: BlockedUser): UserSimpleDisplayWithUidData {
    return {
      firstname: blockedUser.blocked.firstname,
      imageUrl: blockedUser.blocked.imageUrl,
      lastname: blockedUser.blocked.lastname,
      uid: blockedUser.blocked.uid,
    };
  }
}

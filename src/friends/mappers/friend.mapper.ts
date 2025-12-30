import { Friends } from 'generated/prisma/browser';

import { FriendResponseDto } from '../dto/output/friend-response.dto';

type FriendWithUsers = Friends & {
  user1: {
    firstname: string;
    lastname: string;
    imageUrl: string;
  };
  user2: {
    firstname: string;
    lastname: string;
    imageUrl: string;
  };
};

export class FriendMapper {
  static toDto(friend: FriendWithUsers, currentUserUid: string): FriendResponseDto {
    // Select the other user based on the current user uid
    const otherUser = friend.userUid1 === currentUserUid ? friend.user2 : friend.user1;
    const friendUid = friend.userUid1 === currentUserUid ? friend.userUid2 : friend.userUid1;

    return {
      createdAt: friend.createdAt,
      friendUid,
      status: friend.status,
      updatedAt: friend.updatedAt,
      userName: otherUser.firstname + ' ' + otherUser.lastname,
      userProfilePicture: otherUser.imageUrl,
    };
  }

  static toCollectionDto(friends: FriendWithUsers[], currentUserUid: string): FriendResponseDto[] {
    return friends.map((friend) => this.toDto(friend, currentUserUid));
  }
}

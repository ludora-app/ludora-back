import { PinoLogger } from 'nestjs-pino';
import { UserFilterDto } from 'src/users/dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Friends, Prisma } from 'generated/prisma/client';
import { InvitationStatus } from 'generated/prisma/enums';
import { USERSELECT } from 'src/shared/constants/select-user';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FriendResponseData } from './dto/output/friend-response.dto';
import { FriendMapper, FriendWithUsers } from './mappers/friend.mapper';

@Injectable()
export class FriendsService {
  /**
   * The word similarity threshold used by pg_trgm.word_similarity for the friend search
   */
  private readonly WORD_SIMILARITY_THRESHOLD = 0.2;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(FriendsService.name);
  }
  async create(senderUid: string, receiverUid: string): Promise<Friends> {
    if (senderUid === receiverUid) {
      this.logger.error(`User ${senderUid} cannot add himself as a friend`);
      throw new BadRequestException('You cannot add yourself as a friend');
    }
    const existingSender = await this.usersService.findOne(senderUid, USERSELECT.checkIfUserExists);
    if (!existingSender) {
      this.logger.error(`Sender ${senderUid} not found`);
      throw new BadRequestException('Sender not found');
    }
    const existingReceiver = await this.usersService.findOne(
      receiverUid,
      USERSELECT.checkIfUserExists,
    );
    if (!existingReceiver) {
      this.logger.error(`Receiver ${receiverUid} not found`);
      throw new BadRequestException('Receiver not found');
    }
    const existingFriend = await this.prisma.friends.findFirst({
      where: {
        AND: [
          {
            OR: [
              { userUid1: senderUid, userUid2: receiverUid },
              { userUid1: receiverUid, userUid2: senderUid },
            ],
          },
          {
            OR: [{ status: InvitationStatus.ACCEPTED }, { status: InvitationStatus.PENDING }],
          },
        ],
      },
    });
    if (existingFriend) {
      throw new ConflictException('Friend request already exists');
    }

    const newFriendRequest = await this.prisma.friends.create({
      data: {
        status: InvitationStatus.PENDING,
        userUid1: senderUid,
        userUid2: receiverUid,
      },
      include: {
        user1: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
        user2: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
      },
    });

    const friendDto = FriendMapper.toDto(newFriendRequest, receiverUid);

    this.logger.debug(`Friend request sent to ${receiverUid} by ${senderUid}`);

    this.eventEmitter.emit(EventTypes.FRIEND_REQUEST, {
      recipientId: receiverUid,
      senderId: senderUid,
      senderName: friendDto.userName,
    });

    // todo: send a notification to the receiver
    return newFriendRequest;
  }

  async findAll(
    filters: UserFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<FriendResponseData>> {
    const { cursor, limit = 10, name } = filters;

    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.word_similarity_threshold = ${this.WORD_SIMILARITY_THRESHOLD};`,
    );

    let searchWhereSql = Prisma.empty;
    if (name) {
      const searchPattern = `%${name}%`;
      searchWhereSql = Prisma.sql`
        AND (
          -- Search in user1 (when current user is user2)
          (f.user_uid_2 = ${userUid} AND (
            u1.firstname %> ${name}
            OR u1.lastname %> ${name}
            OR u1.firstname ILIKE ${searchPattern}
            OR u1.lastname ILIKE ${searchPattern}
            OR CONCAT(u1.firstname, ' ', u1.lastname) ILIKE ${searchPattern}
          ))
          OR
          -- Search in user2 (when current user is user1)
          (f.user_uid_1 = ${userUid} AND (
            u2.firstname %> ${name}
            OR u2.lastname %> ${name}
            OR u2.firstname ILIKE ${searchPattern}
            OR u2.lastname ILIKE ${searchPattern}
            OR CONCAT(u2.firstname, ' ', u2.lastname) ILIKE ${searchPattern}
          ))
        )
      `;
    }

    // Build cursor pagination
    const cursorCondition = cursor
      ? Prisma.sql`AND (f.user_uid_1, f.user_uid_2) > (${cursor}, '')`
      : Prisma.empty;

    const take = limit + 1;
    const friends = await this.prisma.$queryRaw<FriendWithUsers[]>`
    SELECT 
        f.user_uid_1 as "userUid1",
        f.user_uid_2 as "userUid2",
        f.status,
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        
        -- Build the nested user1 object
        json_build_object(
            'firstname', u1.firstname,
            'lastname', u1.lastname,
            'imageUrl', u1.image_url
        ) as "user1",

        -- Build the nested user2 object
        json_build_object(
            'firstname', u2.firstname,
            'lastname', u2.lastname,
            'imageUrl', u2.image_url
        ) as "user2"

    FROM social."Friends" f
    INNER JOIN auth."Users" u1 ON f.user_uid_1 = u1.uid
    INNER JOIN auth."Users" u2 ON f.user_uid_2 = u2.uid
    WHERE f.status = ${InvitationStatus.ACCEPTED}
        AND (f.user_uid_1 = ${userUid} OR f.user_uid_2 = ${userUid})
        ${searchWhereSql}
        ${cursorCondition}
    ORDER BY f.user_uid_1 ASC, f.user_uid_2 ASC
    LIMIT ${take}
    `;

    let nextCursor: string | null = null;

    if (friends.length > limit) {
      const nextItem = friends.pop();
      nextCursor = nextItem!.userUid1;
    }

    const friendCollectionDto = FriendMapper.toCollectionDto(friends, userUid);

    const friendCollectionWithImageUrl = await Promise.all(
      friendCollectionDto.map(async (friend) => {
        if (!friend.userProfilePicture) {
          return friend;
        }
        const friendImageUrl = await this.storageService.getSignedUrl(
          StorageFolderName.USERS,
          friend.userProfilePicture,
        );
        return { ...friend, userProfilePicture: friendImageUrl };
      }),
    );

    return {
      items: friendCollectionWithImageUrl,
      nextCursor,
      totalCount: friends.length,
    };
  }

  async findOne(
    connectedUserUid: string,
    otherUserUid: string,
  ): Promise<FriendResponseData | null> {
    const existingFriend = await this.prisma.friends.findFirst({
      include: {
        user1: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
        user2: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
      },
      where: {
        AND: [
          {
            OR: [
              { userUid1: connectedUserUid, userUid2: otherUserUid },
              { userUid1: otherUserUid, userUid2: connectedUserUid },
            ],
          },
        ],
      },
    });

    if (!existingFriend) {
      throw new NotFoundException(
        `Friend request between ${connectedUserUid} and ${otherUserUid} not found`,
      );
    }
    const friendDto = FriendMapper.toDto(existingFriend, connectedUserUid);
    if (!friendDto.userProfilePicture) {
      return friendDto;
    }
    const friendImageUrl = await this.storageService.getSignedUrl(
      StorageFolderName.USERS,
      friendDto.userProfilePicture,
    );
    return { ...friendDto, userProfilePicture: friendImageUrl };
  }

  async update(
    connectedUserUid: string,
    receiverUid: string,
    status: InvitationStatus,
  ): Promise<void> {
    let connectedUserIsSender = false;
    let otherUserIsSender = false;
    const existingReceiver = await this.usersService.findOne(
      receiverUid,
      USERSELECT.checkIfUserExists,
    );
    if (!existingReceiver) {
      throw new NotFoundException(`Receiver ${receiverUid} not found`);
    }
    const existingFriend = await this.prisma.friends.findFirst({
      where: {
        AND: [
          {
            OR: [
              { userUid1: connectedUserUid, userUid2: receiverUid },
              { userUid1: receiverUid, userUid2: connectedUserUid },
            ],
          },
          { status: InvitationStatus.PENDING },
        ],
      },
    });
    if (!existingFriend) {
      throw new NotFoundException(
        `Friend request between ${connectedUserUid} and ${receiverUid} not found`,
      );
    }
    if (existingFriend.userUid1 === connectedUserUid) {
      this.logger.debug(`Connected user is the sender of the friend request`);
      connectedUserIsSender = true;
    }
    if (existingFriend.userUid2 === connectedUserUid) {
      this.logger.debug(`Other user is the sender of the friend request`);
      otherUserIsSender = true;
    }

    this.checkUpdateAuthorization(connectedUserIsSender, otherUserIsSender, status);

    const updatedFriend = await this.prisma.friends.update({
      data: { status },
      include: {
        user1: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
        user2: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
          },
        },
      },
      where: {
        userUid1_userUid2: {
          userUid1: existingFriend.userUid1,
          userUid2: existingFriend.userUid2,
        },
      },
    });

    //? The invitation sender (userUid1) is the one to receive the event
    this.emitFriendRequestUpdateEvent(
      existingFriend.userUid1,
      existingFriend.userUid2,
      updatedFriend,
    );

    if (status === InvitationStatus.CANCELED) {
      await this.prisma.friends.delete({
        where: {
          userUid1_userUid2: {
            userUid1: existingFriend.userUid1,
            userUid2: existingFriend.userUid2,
          },
        },
      });
      this.logger.info(`Friend request between ${connectedUserUid} and ${receiverUid} canceled`);
    }

    return;
  }

  checkUpdateAuthorization(
    connectedUserIsSender: boolean,
    otherUserIsSender: boolean,
    status: InvitationStatus,
  ): void {
    // ? Cannot update the status to pending
    if (status === InvitationStatus.PENDING) {
      throw new BadRequestException(`The invitation is already pending`);
    }
    // ? If somehow both conditions are true or both are false, we throw an error
    if (
      (connectedUserIsSender && otherUserIsSender) ||
      (!connectedUserIsSender && !otherUserIsSender)
    ) {
      throw new BadRequestException(`You are not authorized to update this invitation`);
    }
    // ? The sender can only cancel the invitation
    if (connectedUserIsSender && status !== InvitationStatus.CANCELED) {
      throw new BadRequestException(`The invitation sender cannot update the status to ${status}`);
    }

    // ? The receiver can only accept or reject the invitation
    if (otherUserIsSender && status === InvitationStatus.CANCELED) {
      throw new BadRequestException(`The invitation receiver cannot cancel the invitation`);
    }
    return;
  }

  emitFriendRequestUpdateEvent(
    eventReceiverUserUid: string,
    requestAccepterUserUid: string,
    friendRequest: FriendWithUsers,
  ): void {
    let friendDto: FriendResponseData;
    /**
     * If the friend request is accepted, we send the event to the receiver with the connectedUser info
     * If the friend request is rejected, we send the event to the connectedUser with the receiver info
     */
    if (friendRequest.status === InvitationStatus.ACCEPTED) {
      friendDto = FriendMapper.toDto(friendRequest, eventReceiverUserUid);

      this.eventEmitter.emit(EventTypes.FRIEND_ACCEPTED, {
        recipientUid: eventReceiverUserUid,
        senderName: friendDto.userName,
        senderUid: requestAccepterUserUid,
      });
    }

    return;
  }

  async remove(connectedUserUid: string, receiverUid: string): Promise<void> {
    const existingFriend = await this.prisma.friends.findFirst({
      where: {
        AND: [
          {
            OR: [
              { userUid1: connectedUserUid, userUid2: receiverUid },
              { userUid1: receiverUid, userUid2: connectedUserUid },
            ],
          },
          { status: InvitationStatus.ACCEPTED },
        ],
      },
    });
    if (!existingFriend) {
      throw new NotFoundException(
        `Friend request between ${connectedUserUid} and ${receiverUid} not found`,
      );
    }
    await this.prisma.friends.delete({
      where: {
        userUid1_userUid2: {
          userUid1: existingFriend.userUid1,
          userUid2: existingFriend.userUid2,
        },
      },
    });
    this.logger.info(`Friend request between ${connectedUserUid} and ${receiverUid} removed`);
    return;
  }
}

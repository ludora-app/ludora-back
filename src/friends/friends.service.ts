import { PinoLogger } from 'nestjs-pino';
import { UserFilterDto } from 'src/users/dto';
import { Prisma } from 'generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitationStatus } from 'generated/prisma/enums';
import { USERSELECT } from 'src/shared/constants/select-user';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FriendFilterDto } from './dto/input/friend-filter.dto';
import { FriendResponseData } from './dto/output/friend-response.dto';
import { FriendMapper, FriendWithUsers } from './mappers/friend.mapper';
import { FriendRequestResponseData } from './dto/output/friend-request-response.dto';

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
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(FriendsService.name);
  }
  async create(senderUid: string, receiverUid: string): Promise<void> {
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

    this.logger.debug(
      `Friend request sent to ${newFriendRequest.user2.firstname} ${newFriendRequest.user2.lastname} by ${newFriendRequest.user1.firstname} ${newFriendRequest.user1.lastname}`,
    );

    this.eventEmitter.emit(EventTypes.FRIEND_REQUEST, {
      recipientId: receiverUid,
      senderId: senderUid,
      senderName: newFriendRequest.user1.firstname + ' ' + newFriendRequest.user1.lastname,
    });

    return;
  }

  async findAllMyFriends(
    filters: FriendFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<FriendResponseData>> {
    const { cursor, limit = 10, name, sessionUid } = filters;

    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.word_similarity_threshold = ${this.WORD_SIMILARITY_THRESHOLD};`,
    );

    // Build search condition for friend's name
    let searchWhereSql = Prisma.empty;
    if (name) {
      const searchPattern = `%${name}%`;
      searchWhereSql = Prisma.sql`
            AND (
                friend.firstname %> ${name}
                OR friend.lastname %> ${name}
                OR friend.firstname ILIKE ${searchPattern}
                OR friend.lastname ILIKE ${searchPattern}
                OR CONCAT(friend.firstname, ' ', friend.lastname) ILIKE ${searchPattern}
            )
        `;
    }

    // Conditionally add session invitation join
    const sessionJoinSql = sessionUid
      ? Prisma.sql`
            LEFT JOIN sessions."Session_invitations" si ON (
                si.session_uid = ${sessionUid}
                AND si.receiver_uid = friend.uid
            )
          `
      : Prisma.empty;

    const cursorCondition = cursor ? Prisma.sql`AND friend.uid > ${cursor}` : Prisma.empty;

    const take = limit + 1;

    const friends = await this.prisma.$queryRaw<FriendResponseData[]>`
        SELECT 
            uid,
            friend.uid as "friendUid",
            f.created_at as "createdAt",
            friend.firstname,
            friend.lastname,
            friend.image_url as "avatarUrl",
            CASE WHEN ${sessionUid ? Prisma.sql`si.receiver_uid IS NOT NULL` : Prisma.sql`false`} THEN true ELSE false END as "isInvited"
        FROM social."Friends" f
        INNER JOIN auth."Users" friend ON (
            friend.uid = CASE 
                WHEN f.user_uid_1 = ${userUid} THEN f.user_uid_2
                ELSE f.user_uid_1
            END
        )
        ${sessionJoinSql}
        WHERE f.status = ${InvitationStatus.ACCEPTED}
            AND (f.user_uid_1 = ${userUid} OR f.user_uid_2 = ${userUid})
            ${searchWhereSql}
            ${cursorCondition}
        ORDER BY friend.uid ASC
        LIMIT ${take}
    `;

    let nextCursor: string | null = null;
    if (friends.length > limit) {
      const nextItem = friends.pop();
      nextCursor = nextItem!.friendUid;
    }

    return {
      items: friends,
      nextCursor,
      totalCount: friends.length,
    };
  }
  /**
   * Get all friend requests of the connected user
   * @description Gets the friend entity where the connected user is the receiver (userUid2)
   * @param filters
   * @param userUid
   * @returns
   */
  async findAllMyRequests(
    filters: UserFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<FriendRequestResponseData>> {
    const { cursor, limit = 10, name } = filters;

    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.word_similarity_threshold = ${this.WORD_SIMILARITY_THRESHOLD};`,
    );

    // Build search condition for friend's name
    let searchWhereSql = Prisma.empty;
    if (name) {
      const searchPattern = `%${name}%`;
      searchWhereSql = Prisma.sql`
            AND (
                sender.firstname %> ${name}
                OR sender.lastname %> ${name}
                OR sender.firstname ILIKE ${searchPattern}
                OR sender.lastname ILIKE ${searchPattern}
                OR CONCAT(sender.firstname, ' ', sender.lastname) ILIKE ${searchPattern}
            )
        `;
    }

    const cursorCondition = cursor ? Prisma.sql`AND friend.uid > ${cursor}` : Prisma.empty;

    const take = limit + 1;

    const friends = await this.prisma.$queryRaw<FriendRequestResponseData[]>`
        SELECT 
            f.user_uid_1 as "senderUid",
            f.created_at as "createdAt",
            sender.firstname,
            sender.lastname,
            sender.image_url as "avatarUrl"
        FROM social."Friends" f
        INNER JOIN auth."Users" sender ON (
            sender.uid = f.user_uid_1
        )
        WHERE f.status = ${InvitationStatus.PENDING}
            AND f.user_uid_2 = ${userUid}
            ${searchWhereSql}
            ${cursorCondition}
        ORDER BY sender.uid ASC
        LIMIT ${take}
    `;

    let nextCursor: string | null = null;
    if (friends.length > limit) {
      const nextItem = friends.pop();
      nextCursor = nextItem!.senderUid;
    }

    return {
      items: friends,
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

    return friendDto;
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
        senderName: friendDto.firstname + ' ' + friendDto.lastname,
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

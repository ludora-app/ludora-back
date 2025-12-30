import { PinoLogger } from 'nestjs-pino';
import { UserFilterDto } from 'src/users/dto';
import { Friends } from 'generated/prisma/browser';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitationStatus } from 'generated/prisma/enums';
import { USERSELECT } from 'src/shared/constants/select-user';
import { StorageFolderName } from 'src/shared/constants/constants';
import { StorageService } from 'src/shared/storage/storage.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FriendMapper } from './mappers/friend.mapper';
import { UpdateFriendDto } from './dto/input/update-friend.dto';
import { FriendResponseDto } from './dto/output/friend-response.dto';

@Injectable()
export class FriendsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly storageService: StorageService,
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
    });

    // todo: send a notification to the receiver
    return newFriendRequest;
  }

  async findAll(
    filters: UserFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<FriendResponseDto>> {
    const { cursor, limit, name } = filters;

    const query: any = {
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
            OR: [{ userUid1: userUid }, { userUid2: userUid }],
          },
          { status: InvitationStatus.ACCEPTED },
        ],
      },
    };

    if (name) {
      query.where.AND.push({
        OR: [
          { user1: { firstname: { contains: name, mode: 'insensitive' } } },
          { user2: { firstname: { contains: name, mode: 'insensitive' } } },
          { user1: { lastname: { contains: name, mode: 'insensitive' } } },
          { user2: { lastname: { contains: name, mode: 'insensitive' } } },
        ],
      });
    }
    if (limit) {
      query.take = limit + 1;
    }
    if (cursor) {
      query.cursor = cursor;
    }
    const friends = await this.prisma.friends.findMany(query);
    const friendCollectionDto = FriendMapper.toCollectionDto(friends as any, userUid);
    const friendCollectionWithImageUrl = await Promise.all(
      friendCollectionDto.map(async (friend) => {
        const friendImageUrl = await this.storageService.getSignedUrl(
          StorageFolderName.USERS,
          friend.userProfilePicture,
        );
        return { ...friend, userProfilePicture: friendImageUrl };
      }),
    );
    let nextCursor: string | null = null;
    if (friends.length > limit) {
      const nextItem = friends.pop();
      nextCursor = nextItem!.userUid1;
    }
    return {
      items: friendCollectionWithImageUrl,
      nextCursor,
      totalCount: friends.length,
    };
  }

  async findOne(senderUid: string, receiverUid: string): Promise<FriendResponseDto> {
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
              { userUid1: senderUid, userUid2: receiverUid },
              { userUid1: receiverUid, userUid2: senderUid },
            ],
          },
        ],
      },
    });

    if (!existingFriend) {
      throw new NotFoundException(
        `Friend request between ${senderUid} and ${receiverUid} not found`,
      );
    }
    const friendDto = FriendMapper.toDto(existingFriend, senderUid);
    if (!friendDto.userProfilePicture) {
      return friendDto;
    }
    const friendImageUrl = await this.storageService.getSignedUrl(
      StorageFolderName.USERS,
      friendDto.userProfilePicture,
    );
    return { ...friendDto, userProfilePicture: friendImageUrl };
  }

  update(id: number, _updateFriendDto: UpdateFriendDto) {
    return `This action updates a #${id} friend`;
  }

  remove(id: number) {
    return `This action removes a #${id} friend`;
  }
}

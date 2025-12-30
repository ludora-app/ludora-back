import { PinoLogger } from 'nestjs-pino';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitationStatus } from 'generated/prisma/enums';
import { USERSELECT } from 'src/shared/constants/select-user';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';

import { UpdateFriendDto } from './dto/input/update-friend.dto';
import { FriendResponseDto } from './dto/output/friend-response.dto';

@Injectable()
export class FriendsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FriendsService.name);
  }
  async create(senderUid: string, receiverUid: string): Promise<FriendResponseDto> {
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
    return newFriendRequest;
  }

  findAll() {
    return `This action returns all friends`;
  }

  findOne(id: number) {
    return `This action returns a #${id} friend`;
  }

  update(id: number, _updateFriendDto: UpdateFriendDto) {
    return `This action updates a #${id} friend`;
  }

  remove(id: number) {
    return `This action removes a #${id} friend`;
  }
}

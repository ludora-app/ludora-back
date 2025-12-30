import { Injectable } from '@nestjs/common';

import { CreateFriendDto } from './dto/input/create-friend.dto';
import { UpdateFriendDto } from './dto/input/update-friend.dto';

@Injectable()
export class FriendsService {
  create(_createFriendDto: CreateFriendDto) {
    return 'This action adds a new friend';
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

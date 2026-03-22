import { Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersService } from 'src/users/users.service';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  controllers: [FriendsController],
  imports: [],
  providers: [FriendsService, UsersService, StorageService],
})
export class FriendsModule {}

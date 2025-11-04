import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [SharedModule],
  providers: [UsersService, StorageService],
})
export class UsersModule {}

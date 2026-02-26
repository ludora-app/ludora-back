import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [SharedModule],
  providers: [UsersService, StorageService],
})
export class UsersModule {}

import { Global, Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Global()
@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [],
  providers: [UsersService, StorageService],
})
export class UsersModule {}

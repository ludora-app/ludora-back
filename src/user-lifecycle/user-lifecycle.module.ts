import { Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { UserLifecycleService } from './user-lifecycle.service';

@Module({
  imports: [],
  providers: [UserLifecycleService, StorageService],
})
export class UserLifecycleModule {}

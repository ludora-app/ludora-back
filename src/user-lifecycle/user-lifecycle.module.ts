import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { UserLifecycleService } from './user-lifecycle.service';

@Module({
  imports: [SharedModule],
  providers: [UserLifecycleService, StorageService],
})
export class UserLifecycleModule {}

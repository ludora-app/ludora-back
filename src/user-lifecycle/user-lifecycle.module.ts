import { Module } from '@nestjs/common';
import { AppleModule } from 'src/apple/apple.module';
import { AppleService } from 'src/apple/apple.service';
import { EncryptionService } from 'src/shared/encryption/encryption.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { UserLifecycleService } from './user-lifecycle.service';

@Module({
  imports: [AppleModule],
  providers: [UserLifecycleService, StorageService, AppleService, EncryptionService],
})
export class UserLifecycleModule {}

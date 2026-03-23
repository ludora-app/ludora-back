import { Module } from '@nestjs/common';
import { EncryptionService } from 'src/shared/encryption/encryption.service';
import { AppleService } from './apple.service';

@Module({
  providers: [AppleService, EncryptionService],
  exports: [AppleService],
})
export class AppleModule {}

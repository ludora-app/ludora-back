import { Global, Module } from '@nestjs/common';

import { FirebaseService } from './firebase.service';

@Global()
@Module({
  exports: [FirebaseService],
  providers: [FirebaseService],
})
export class FirebaseModule {}

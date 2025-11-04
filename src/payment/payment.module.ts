import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  controllers: [PaymentController],
  imports: [UsersModule, SharedModule],
  providers: [PaymentService, PrismaService, UsersService],
})
export class PaymentModule {}

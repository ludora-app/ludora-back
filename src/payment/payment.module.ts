import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  imports: [UsersModule, SharedModule],
  providers: [PaymentService, PrismaService, UsersService],
})
export class PaymentModule {}

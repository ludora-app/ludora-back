import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  imports: [SharedModule, UsersModule],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}

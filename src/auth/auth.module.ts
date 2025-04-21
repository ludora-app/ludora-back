import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: '60s' },
    }),
    UsersModule,
    SharedModule,
  ],
  providers: [AuthService, UsersService, PrismaService],
})
export class AuthModule {}

import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';

import { RegisterB2BDto } from './dto/input/register-b2b.dto';

@Injectable()
export class AuthB2BService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
  ) {}

  async register(dto: RegisterB2BDto) {
    const { userAddress, userEmail, userFirstname, userLastname, userPassword, userPhone } = dto;
    const existingUser = await this.userService.findOneByEmail(userEmail);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
  }
}

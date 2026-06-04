import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from './users.service';

@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext(UsersAdminService.name);
  }

  async adminDeleteUser(uid: string): Promise<void> {
    const user = await this.usersService.findOne(uid, USERSELECT.checkIfUserExists);

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.users.delete({ where: { uid } });

    this.logger.warn(`[ADMIN ACTION] - User ${user.email} (${uid}) has been deleted by an admin`);
  }
}

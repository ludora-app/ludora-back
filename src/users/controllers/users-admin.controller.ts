import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { UsersService } from '../users.service';

@Controller('users/admin')
@UseGuards(AdminGuard)
@ApiExcludeController()
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':uid')
  async deleteUser(@Param('uid') userUid: string) {
    return await this.usersService.adminDeleteUser(userUid);
  }
}

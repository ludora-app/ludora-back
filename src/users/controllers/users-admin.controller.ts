import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { UsersAdminService } from '../services/users-admin.service';

@Controller('users/admin')
@UseGuards(AdminGuard)
@ApiExcludeController()
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Delete(':uid')
  async deleteUser(@Param('uid') userUid: string) {
    return await this.usersAdminService.adminDeleteUser(userUid);
  }
}

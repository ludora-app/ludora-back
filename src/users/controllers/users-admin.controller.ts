import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Public } from 'src/shared/decorators/public.decorator';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ReportFilterDto } from '../dto/input/report-filter.dto';
import {
  FindAllReportedUsersResponseData,
  FindAllReportedUsersResponseDto,
} from '../dto/output/find-all-reported-users-response.dto';
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

  @Get()
  @ApiOkResponse({ type: FindAllReportedUsersResponseDto })
  @Public()
  async getUsersOrderedByReports(
    @Query() params: ReportFilterDto,
  ): Promise<PaginationResponseTypeDto<FindAllReportedUsersResponseData>> {
    const data = await this.usersAdminService.getUsersOrderedByReports(params);
    return { data, message: 'Users fetched successfully' };
  }
}

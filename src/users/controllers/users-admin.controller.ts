import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExcludeController,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { CreateUserBanParamDto } from '../dto/input/create-user-ban.dto';
import { ReportFilterDto } from '../dto/input/report-filter.dto';
import {
  FindAllReportedUsersResponseData,
  FindAllReportedUsersResponseDto,
} from '../dto/output/find-all-reported-users-response.dto';
import { FindOneUserWithReportsResponseDto } from '../dto/output/find-one-with-reports-response.dto';
import { UsersAdminService } from '../services/users-admin.service';

@Controller('users/admin')
@UseGuards(AdminGuard)
@ApiExcludeController()
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Get('list-reports/collection')
  @ApiOperation({ description: 'get users order by the number of reports made against them' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiOkResponse({ type: FindAllReportedUsersResponseDto })
  async findAllUsersOrderedByReports(
    @Query() params: ReportFilterDto,
  ): Promise<PaginationResponseTypeDto<FindAllReportedUsersResponseData>> {
    const data = await this.usersAdminService.findAllUsersOrderedByReports(params);
    return { data, message: 'Users fetched successfully' };
  }

  @Get(':uid/reports')
  @ApiOperation({ description: 'get user with all the reports made against them' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiOkResponse({ type: FindOneUserWithReportsResponseDto })
  async findOneWithReports(@Param('uid') uid: string) {
    const data = await this.usersAdminService.findOneWithReports(uid);
    return { data, message: 'User fetched successfully' };
  }

  @Delete(':uid')
  @ApiExcludeEndpoint()
  @ApiOperation({ description: 'complety deletes a user for ever from the database' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('uid') userUid: string) {
    return await this.usersAdminService.adminDeleteUser(userUid);
  }

  @Delete(':uid/ban')
  @ApiOperation({ description: 'bans a user' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiNoContentResponse({ description: 'User banned successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUser(@Param('uid') userUid: string, @Body() body: CreateUserBanParamDto) {
    return await this.usersAdminService.banUser({ userUid, ...body });
  }
}

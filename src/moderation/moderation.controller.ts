import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { SWAGGER_TAG_MODERATION } from 'src/swagger/swagger.config';
import { UserSimpleDisplayWithUidData } from 'src/users/dto';
import { CreateReportDto } from './dto/input/create-report.dto';
import { PaginatedBlockedUsersResponseDto } from './dto/output/blocked-users-response.dto';
import { ModerationService } from './moderation.service';

@ApiTags(SWAGGER_TAG_MODERATION)
@Controller('moderation')
@UseGuards(AuthB2CGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('block/:userToBlockUid')
  @Protected()
  @ApiOperation({ summary: 'Block a user' })
  @ApiNoContentResponse({ description: 'User blocked successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockUser(
    @CurrentUser('uid') blockerUid: string,
    @Param('userToBlockUid') userToBlockUid: string,
  ): Promise<void> {
    return await this.moderationService.blockUser(blockerUid, userToBlockUid);
  }

  @Post('report')
  @Protected()
  @ApiOperation({ summary: 'Report a user' })
  @ApiNoContentResponse({ description: 'Report created successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createReport(
    @CurrentUser('uid') reporterUid: string,
    @Body() createReportDto: CreateReportDto,
  ): Promise<void> {
    return await this.moderationService.createReport(reporterUid, createReportDto);
  }

  @Get('list-blocked-users')
  @Protected()
  @ApiOperation({ summary: 'Get all blocked users' })
  @ApiOkResponse({
    description: 'Blocked users fetched successfully',
    type: PaginatedBlockedUsersResponseDto,
  })
  async findAllBlockedUsers(
    @CurrentUser('uid') blockerUid: string,
  ): Promise<PaginationResponseTypeDto<UserSimpleDisplayWithUidData>> {
    const data = await this.moderationService.findAllBlockedUsers(blockerUid);
    return {
      data,
      message: 'Blocked users fetched successfully',
    };
  }

  @Delete('unblock/:userToUnblockUid')
  @Protected()
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiNoContentResponse({ description: 'User unblocked successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(
    @CurrentUser('uid') blockerUid: string,
    @Param('userToUnblockUid') userToUnblockUid: string,
  ): Promise<void> {
    return await this.moderationService.unblockUser(blockerUid, userToUnblockUid);
  }
}

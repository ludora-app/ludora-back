import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayWithUidData } from 'src/users/dto';
import { CreateReportDto } from './dto/input/create-report.dto';
import { PaginatedBlockedUsersResponseDto } from './dto/output/blocked-users-response.dto';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
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
    @Req() request: Request,
    @Param('userToBlockUid') userToBlockUid: string,
  ): Promise<void> {
    const blockerUid = request['user'].uid;
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
    @Req() request: Request,
    @Body() createReportDto: CreateReportDto,
  ): Promise<void> {
    const reporterUid = request['user'].uid;
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
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<UserSimpleDisplayWithUidData>> {
    const blockerUid = request['user'].uid;
    const data = await this.moderationService.findAllBlockedUsers(blockerUid);
    return {
      data,
      message: 'Blocked users fetched successfully',
    };
  }
}

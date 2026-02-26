import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { CreateManySessionInvitationDto } from '../dto/input/create-many-session-invitation.dto';
import { SessionInvitationFilterDto } from '../dto/input/session-invitation-filter.dto';
import { UpdateSessionInvitationDto } from '../dto/input/update-session-invitation.dto';
import {
  PaginatedSessionInvitationResponseDto,
  SessionInvitationResponseData,
  SessionInvitationResponseDto,
} from '../dto/output/session-invitation-response';
import { SessionInvitationsService } from '../services/session-invitations.service';

@Controller('session-invitations')
@UseGuards(AuthB2CGuard)
export class SessionInvitationsController {
  constructor(private readonly sessionInvitationsService: SessionInvitationsService) {}

  @Post(':sessionUid')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({ summary: 'Create multiple session invitations' })
  @ApiCreatedResponse({ type: ResponseTypeDto<SessionInvitationResponseData> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createMany(
    @Param('sessionUid') sessionUid: string,
    @Body() dto: CreateManySessionInvitationDto,
    @Req() request: Request,
  ): Promise<void> {
    const senderUid = request['user'].uid;
    await this.sessionInvitationsService.createMany(senderUid, sessionUid, dto);
    return;
  }

  @Get('list-by-user/collection/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all session invitations by user ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserId(
    @Param('userUid') userUid: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionInvitationResponseData>> {
    const sessionInvitations = await this.sessionInvitationsService.findAllByReceiverId(
      userUid,
      sessionInvitationFilterDto,
    );

    return {
      data: sessionInvitations,
      message: 'Session invitations fetched successfully',
    };
  }

  @Get('list-by-session/collection/:sessionUid')
  @Protected()
  @ApiOperation({ summary: 'Get all session invitations by session ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllBySessionId(
    @Param('sessionUid') sessionUid: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionInvitationResponseData>> {
    const sessionInvitations = await this.sessionInvitationsService.findAllBySessionId(
      sessionUid,
      sessionInvitationFilterDto,
    );

    return {
      data: sessionInvitations,
      message: 'Session invitations fetched successfully',
    };
  }

  @Get(':sessionUid/:receiverUid')
  @Protected()
  @ApiOperation({ summary: 'Get a session invitation by session ID and receiver ID' })
  @ApiOkResponse({ type: SessionInvitationResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOne(
    @Param('sessionUid') sessionUid: string,
    @Param('receiverUid') receiverUid: string,
  ): Promise<ResponseTypeDto<SessionInvitationResponseData>> {
    const invitation = await this.sessionInvitationsService.findOne(sessionUid, receiverUid);

    if (!invitation) {
      throw new NotFoundException('Session invitation not found');
    }

    return {
      data: invitation,
      message: 'Session invitation fetched successfully',
    };
  }

  @Patch(':sessionUid')
  @Protected()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a session invitation by session UID' })
  @ApiNoContentResponse({ description: 'Session invitation updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  update(
    @Param('sessionUid') sessionUid: string,
    @Body() body: { status: InvitationStatus },
    @Req() request: Request,
  ): Promise<void> {
    const userUid = request['user'].uid;
    const updateSessionInvitationDto: UpdateSessionInvitationDto = {
      sessionUid,
      status: body.status,
      userUid,
    };
    return this.sessionInvitationsService.update(updateSessionInvitationDto);
  }

  // @Delete(':sessionUid/:userId')
  // remove(@Param('sessionUid') sessionUid: string, @Param('userId') userId: string) {
  //   return this.sessionInvitationsService.remove(sessionUid, userId);
  // }
}

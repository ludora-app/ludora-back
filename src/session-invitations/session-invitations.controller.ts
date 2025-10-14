import { Invitation_status } from '@prisma/client';
import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { SessionInvitationsService } from './session-invitations.service';
import { CreateSessionInvitationDto } from './dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';
import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import {
  PaginatedSessionInvitationResponse,
  SessionInvitationResponse,
} from './dto/output/session-invitation-response';

@Controller('session-invitations')
export class SessionInvitationsController {
  constructor(private readonly sessionInvitationsService: SessionInvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session invitation' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiConflictResponse({ type: ConflictException })
  async create(
    @Req() request: Request,
    @Body() createSessionInvitationDto: CreateSessionInvitationDto,
  ): Promise<ResponseType<SessionInvitationResponse>> {
    const senderUid = request['user'].uid;

    const invitation = await this.sessionInvitationsService.create(
      senderUid,
      createSessionInvitationDto,
    );

    if (!invitation) {
      throw new BadRequestException('Failed to create session invitation');
    }

    return {
      data: invitation,
      message: 'Session invitation created successfully',
      status: 201,
    };
  }

  @Get('all-by-user/:userUid')
  @ApiOperation({ summary: 'Get all session invitations by user ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async findAllByUserId(
    @Param('userUid') userUid: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionInvitationResponse>> {
    const sessionInvitations = await this.sessionInvitationsService.findAllByReceiverId(
      userUid,
      sessionInvitationFilterDto,
    );

    return {
      data: sessionInvitations,
      message: 'Session invitations fetched successfully',
      status: 200,
    };
  }

  @Get('all-by-session/:sessionUid')
  @ApiOperation({ summary: 'Get all session invitations by session ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async findAllBySessionId(
    @Param('sessionUid') sessionUid: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionInvitationResponse>> {
    const sessionInvitations = await this.sessionInvitationsService.findAllBySessionId(
      sessionUid,
      sessionInvitationFilterDto,
    );

    return {
      data: sessionInvitations,
      message: 'Session invitations fetched successfully',
      status: 200,
    };
  }

  @Get(':sessionUid/:receiverUid')
  @ApiOperation({ summary: 'Get a session invitation by session ID and receiver ID' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOne(
    @Param('sessionUid') sessionUid: string,
    @Param('receiverUid') receiverUid: string,
  ): Promise<ResponseType<SessionInvitationResponse>> {
    const invitation = await this.sessionInvitationsService.findOne(sessionUid, receiverUid);

    if (!invitation) {
      throw new NotFoundException('Session invitation not found');
    }

    return {
      data: invitation,
      message: 'Session invitation fetched successfully',
      status: 200,
    };
  }

  @Patch(':sessionUid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a session invitation by session UID' })
  @ApiNoContentResponse({ description: 'Session invitation updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  update(
    @Param('sessionUid') sessionUid: string,
    @Body() body: { status: Invitation_status },
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

  @Delete(':sessionUid/:userId')
  remove(@Param('sessionUid') sessionUid: string, @Param('userId') userId: string) {
    return this.sessionInvitationsService.remove(sessionUid, userId);
  }
}

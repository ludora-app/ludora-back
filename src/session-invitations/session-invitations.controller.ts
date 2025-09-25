import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';
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
    const senderId = request['user'].id;

    const invitation = await this.sessionInvitationsService.create(
      senderId,
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

  @Get('all-by-session/:sessionId')
  @ApiOperation({ summary: 'Get all session invitations by session ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async findAllBySessionId(
    @Param('sessionId') sessionId: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionInvitationResponse>> {
    const sessionInvitations = await this.sessionInvitationsService.findAllBySessionId(
      sessionId,
      sessionInvitationFilterDto,
    );

    return {
      data: sessionInvitations,
      message: 'Session invitations fetched successfully',
      status: 200,
    };
  }

  @Get(':sessionId/:receiverId')
  @ApiOperation({ summary: 'Get a session invitation by session ID and receiver ID' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOne(
    @Param('sessionId') sessionId: string,
    @Param('receiverId') receiverId: string,
  ): Promise<ResponseType<SessionInvitationResponse>> {
    const invitation = await this.sessionInvitationsService.findOne(sessionId, receiverId);

    if (!invitation) {
      throw new NotFoundException('Session invitation not found');
    }

    return {
      data: invitation,
      message: 'Session invitation fetched successfully',
      status: 200,
    };
  }

  @Patch()
  update(@Body() updateSessionInvitationDto: UpdateSessionInvitationDto) {
    return this.sessionInvitationsService.update(updateSessionInvitationDto);
  }

  @Delete(':sessionId/:userId')
  remove(@Param('sessionId') sessionId: string, @Param('userId') userId: string) {
    return this.sessionInvitationsService.remove(sessionId, userId);
  }
}

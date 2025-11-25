import { InvitationStatus } from '@prisma/client';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { ResponseType, ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionInvitationsService } from './session-invitations.service';
import { CreateSessionInvitationDto } from './dto/input/create-session-invitation.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';
import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import {
  PaginatedSessionInvitationResponse,
  SessionInvitationResponse,
} from './dto/output/session-invitation-response';

@Controller('session-invitations')
@UseGuards(AuthB2CGuard)
@ApiBearerAuth('JWT-auth')
export class SessionInvitationsController {
  constructor(private readonly sessionInvitationsService: SessionInvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session invitation' })
  @ApiCreatedResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.CREATED)
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
    };
  }

  @Get('list-by-user/:userUid')
  @ApiOperation({ summary: 'Get all session invitations by user ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
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
    };
  }

  @Get('list-by-session/:sessionUid')
  @ApiOperation({ summary: 'Get all session invitations by session ID' })
  @ApiOkResponse({ type: PaginatedSessionInvitationResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
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
    };
  }

  @Get(':sessionUid/:receiverUid')
  @ApiOperation({ summary: 'Get a session invitation by session ID and receiver ID' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
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
    };
  }

  @Patch(':sessionUid')
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

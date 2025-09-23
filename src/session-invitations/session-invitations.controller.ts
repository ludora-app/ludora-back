import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';
import { CreateSessionInvitationDto } from './dto/input/create-session-invitation.dto';
import { SessionInvitationFilterDto } from './dto/input/session-invitation-filter.dto';
import { UpdateSessionInvitationDto } from './dto/input/update-session-invitation.dto';
import { SessionInvitationResponse } from './dto/output/session-invitation-response';
import { SessionInvitationsService } from './session-invitations.service';

@Controller('session-invitations')
export class SessionInvitationsController {
  constructor(private readonly sessionInvitationsService: SessionInvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session invitation' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionInvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async create(
    @Body() createSessionInvitationDto: CreateSessionInvitationDto,
  ): Promise<ResponseType<SessionInvitationResponse>> {
    const invitation = await this.sessionInvitationsService.create(createSessionInvitationDto);

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
  findAll(
    @Param('userUid') userUid: string,
    @Query() sessionInvitationFilterDto: SessionInvitationFilterDto,
  ) {
    return this.sessionInvitationsService.findAllByUserId(userUid, sessionInvitationFilterDto);
  }

  @Get(':sessionId/:userId')
  findOne(@Param('sessionId') sessionId: string, @Param('userId') userId: string) {
    return this.sessionInvitationsService.findOne(sessionId, userId);
  }

  @Patch(':sessionId/:userId')
  update(
    @Param('sessionId') sessionId: string,
    @Param('userId') userId: string,
    @Body() updateSessionInvitationDto: UpdateSessionInvitationDto,
  ) {
    return this.sessionInvitationsService.update(sessionId, userId, updateSessionInvitationDto);
  }

  @Delete(':sessionId/:userId')
  remove(@Param('sessionId') sessionId: string, @Param('userId') userId: string) {
    return this.sessionInvitationsService.remove(sessionId, userId);
  }
}

import { SessionPlayers } from 'generated/prisma/browser';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { ApiBadRequestResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { SessionsService } from '../services/sessions.service';
import { JoinSessionDto } from '../dto/input/create-session-player.dto';

@Controller('session-players')
@UseGuards(AuthB2CGuard)
export class SessionPlayersController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('join')
  @Protected()
  @ApiOperation({ summary: 'Allows a user to join a session' })
  //   @ApiCreatedResponse({ type: ResponseTypeDto<SessionPlayers> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async joinSession(
    @Req() request: Request,
    @Body() joinSessionDto: JoinSessionDto,
  ): Promise<ResponseTypeDto<SessionPlayers>> {
    const userUid = request['user'].uid;
    const newPlayer = await this.sessionsService.joinSession({ ...joinSessionDto, userUid });
    return {
      data: newPlayer,
      message: 'Player joined session successfully',
    };
  }
}

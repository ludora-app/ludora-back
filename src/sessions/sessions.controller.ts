import { Sessions } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Body,
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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionsService } from './sessions.service';
import { SessionMapper } from './mappers/session.mapper';
import { SessionResponse } from './dto/output/session.response';
import { CreateSessionDto } from './dto/input/create-session.dto';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';
import {
  PaginatedSessionCollectionResponse,
  SessionCollectionItem,
} from './dto/output/session-collection.response';

@Controller('sessions')
@UseGuards(AuthB2CGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiCreatedResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSessionDto: CreateSessionDto,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<SessionResponse>> {
    const userUid = request['user'].uid;
    const newSession = await this.sessionsService.create({ ...createSessionDto, userUid });

    return {
      data: SessionMapper.toDto(newSession),
      message: 'Session created successfully',
    };
  }

  @Get('/list/collection')
  @Protected()
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ type: PaginatedSessionCollectionResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filter: SessionFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionCollectionItem>> {
    const sessions = await this.sessionsService.findAll(filter);

    return {
      data: {
        items: sessions.items,
        nextCursor: sessions.nextCursor,
        totalCount: sessions.totalCount,
      },
      message: 'Sessions fetched successfully',
    };
  }

  @Get(':uid')
  @Protected()
  @ApiOperation({ summary: 'Get a session by uid' })
  @ApiOkResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOne(@Param('uid') uid: string): Promise<ResponseTypeDto<SessionResponse>> {
    const session = await this.sessionsService.findOne(uid);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      data: SessionMapper.toDto(session),
      message: 'Session fetched successfully',
    };
  }

  @Patch(':uid')
  @Protected()
  @ApiOperation({ summary: 'Update a session by uid' })
  @ApiNoContentResponse({ description: 'Session updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('uid') uid: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<void> {
    await this.sessionsService.update(uid, updateSessionDto);

    return;
  }

  @Delete(':uid')
  @Protected()
  async remove(@Param('uid') uid: string) {
    return this.sessionsService.remove(uid);
  }
}

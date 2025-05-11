import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { SessionsService } from './sessions.service';
// import { UpdateSessionDto } from './dto/update-session.dto';
// import { CreateSessionDto } from './dto/input/create-session.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionFilterDto } from './dto/input/session-filter.dto';
import { FindAllSessionsResponse } from './dto/output/find-all-sessions.res';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // @Post()
  // create(@Body() createSessionDto: CreateSessionDto) {
  //   return this.sessionsService.create(createSessionDto);
  // }

  @Get('/all')
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ type: FindAllSessionsResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  findAll(@Query() filter: SessionFilterDto) {
    return this.sessionsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
  //   return this.sessionsService.update(+id, updateSessionDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(+id);
  }
}

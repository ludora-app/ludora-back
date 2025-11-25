import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
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

import { UserSportPreferencesService } from './user-sport-preferences.service';
import { CreateUserSportPreferenceDto } from './dto/input/create-user-sport-preference.dto';
import { PaginatedUserSportPreferenceResponse } from './dto/output/user-sport-preference.response';

@Controller('user-sport-preferences')
export class UserSportPreferencesController {
  constructor(private readonly userSportPreferencesService: UserSportPreferencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user sport preference' })
  @ApiCreatedResponse({ description: 'User sport preference created successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createUserSportPreferenceDto: CreateUserSportPreferenceDto,
    @Req() request: Request,
  ) {
    const userUid = request['user'].uid;
    return this.userSportPreferencesService.create(createUserSportPreferenceDto.sport, userUid);
  }

  @Get('list-by-user/:userUid')
  @ApiOperation({ summary: 'Get all user sport preferences by user ID' })
  @ApiOkResponse({ type: PaginatedUserSportPreferenceResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  findAllByUserUid(@Param('userUid') userUid: string) {
    return this.userSportPreferencesService.findAllByUserUid(userUid);
  }

  @Delete(':uid')
  @ApiOperation({ summary: 'Delete a user sport preference by uid' })
  @ApiNoContentResponse({ description: 'User sport preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string, @Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.userSportPreferencesService.remove(uid, userUid);
  }
}

import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserHourPreferencesService } from './user-hour-preferences.service';
import { UserHourPreferenceResponse } from './dto/output/user-hour-preference-response';
import { CreateUserHourPreferenceDto } from './dto/input/create-user-hour-preference.dto';
import { UpdateUserHourPreferenceDto } from './dto/input/update-user-hour-preference.dto';

@Controller('user-hour-preferences')
export class UserHourPreferencesController {
  constructor(private readonly userHourPreferencesService: UserHourPreferencesService) {}

  @ApiOperation({ summary: 'Create a new user hour preference' })
  @ApiCreatedResponse({ type: ResponseTypeDto<UserHourPreferenceResponse> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Req() request: Request,
    @Body() createUserHourPreferenceDto: CreateUserHourPreferenceDto,
  ): Promise<ResponseTypeDto<UserHourPreferenceResponse>> {
    const uid = request['user'].uid;

    const data = await this.userHourPreferencesService.create(uid, createUserHourPreferenceDto);

    return { data, message: 'User hour preference created successfully' };
  }

  // @Get()

  // findAll() {
  //   return this.userHourPreferencesService.findAll();
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userHourPreferencesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserHourPreferenceDto: UpdateUserHourPreferenceDto,
  ) {
    return this.userHourPreferencesService.update(+id, updateUserHourPreferenceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userHourPreferencesService.remove(+id);
  }
}

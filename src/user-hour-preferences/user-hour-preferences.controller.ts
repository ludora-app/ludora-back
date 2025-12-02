import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
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

import { UserHourPreferencesService } from './user-hour-preferences.service';
import { CreateUserHourPreferenceDto } from './dto/input/create-user-hour-preference.dto';
import {
  PaginatedUserHourPreferenceResponse,
  UserHourPreferenceResponse,
} from './dto/output/user-hour-preference-response';

@Controller('user-hour-preferences')
@UseGuards(AuthB2CGuard)
export class UserHourPreferencesController {
  constructor(private readonly userHourPreferencesService: UserHourPreferencesService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new user hour preference' })
  @ApiCreatedResponse({ type: ResponseTypeDto<UserHourPreferenceResponse> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() request: Request,
    @Body() createUserHourPreferenceDto: CreateUserHourPreferenceDto,
  ): Promise<ResponseTypeDto<UserHourPreferenceResponse>> {
    const uid = request['user'].uid;

    const data = await this.userHourPreferencesService.create(uid, createUserHourPreferenceDto);

    return { data, message: 'User hour preference created successfully' };
  }

  @Get('list-by-user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all user hour preferences by user ID' })
  @ApiOkResponse({ type: PaginatedUserHourPreferenceResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Param('userUid') userUid: string,
  ): Promise<PaginationResponseTypeDto<UserHourPreferenceResponse>> {
    const data = await this.userHourPreferencesService.findAllByUserUid(userUid);
    return {
      data,
      message: 'User hour preferences fetched successfully',
    };
  }

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a user hour preference by uid' })
  @ApiNoContentResponse({ description: 'User hour preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string, @Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.userHourPreferencesService.remove(uid, userUid);
  }
}

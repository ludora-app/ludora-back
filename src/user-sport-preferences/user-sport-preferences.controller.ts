import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
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

import { UserSportPreferencesService } from './user-sport-preferences.service';
import { CreateUserSportPreferenceDtoFromRequest } from './dto/input/create-user-sport-preference.dto';
import {
  PaginatedUserSportPreferenceResponseDto,
  UserSportPreferenceResponseDto,
} from './dto/output/user-sport-preference.response.dto';

@Controller('user-sport-preferences')
@UseGuards(AuthB2CGuard)
export class UserSportPreferencesController {
  constructor(private readonly userSportPreferencesService: UserSportPreferencesService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a user sport preference' })
  @ApiCreatedResponse({ type: ResponseTypeDto<UserSportPreferenceResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserSportPreferenceDtoFromRequest,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<UserSportPreferenceResponseDto>> {
    const userUid = request['user'].uid;
    const data = await this.userSportPreferencesService.create({
      ...dto,
      userUid,
    });
    return {
      data,
      message: 'User sport preference created successfully',
    };
  }

  @Get('list-by-user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all user sport preferences by user ID' })
  @ApiOkResponse({ type: PaginatedUserSportPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(@Param('userUid') userUid: string) {
    const data = await this.userSportPreferencesService.findAllByUserUid(userUid);
    return {
      data,
      message: 'User sport preferences fetched successfully',
    };
  }

  @Get('my-list')
  @Protected()
  @ApiOperation({ summary: 'Get the sport preferences of the connected user' })
  @ApiOkResponse({ type: PaginatedUserSportPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMySportPreferences(@Req() request: Request) {
    const userUid = request['user'].uid;
    const data = await this.userSportPreferencesService.findAllByUserUid(userUid);

    if (data.items.length === 0) {
      return {
        data: null,
        message: 'User does not have any sport preferences yet',
      };
    }

    return {
      data,
      message: 'User sport preferences fetched successfully',
    };
  }

  @Delete(':uid')
  @Protected()
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

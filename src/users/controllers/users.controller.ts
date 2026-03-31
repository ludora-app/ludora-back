import {
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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Users } from 'generated/prisma/client';
import { CreateImageDto } from 'src/auth/dto';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Public } from 'src/shared/decorators/public.decorator';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { SWAGGER_TAG_USERS } from 'src/swagger.config';
import { USERSELECT } from '../../shared/constants/select-user';
import {
  FindAllUsersResponseDataDto,
  FindAllUsersResponseDto,
  FindMeUserResponseData,
  FindMeUserResponseDto,
  FindOneUserResponseData,
  FindOneUserResponseDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UpdateUserEmailDto,
  UserFilterDto,
} from '../dto';
import { PasswordResetRequestDto } from '../dto/input/password-reset-request.dto';
import { RawUserFindMe, RawUserFindOne, UserMapper } from '../mappers/user.mapper';
import { UsersService } from '../users.service';

@ApiTags(SWAGGER_TAG_USERS)
@Controller('users')
@UseGuards(AuthB2CGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Protected()
  @Post('/password-reset-request')
  @ApiNoContentResponse({ description: 'Password reset request sent successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'This method is used to initiate the password reset process, sends a verification code to the user email',
  })
  async passwordResetRequest(@Body() dto: PasswordResetRequestDto): Promise<void> {
    await this.usersService.sendCodeForPasswordResetRequest(dto.email);
    return;
  }

  @Get('/list/collection')
  @Protected()
  @ApiOperation({
    summary: 'Retrieves all users with scoring based on preferences',
  })
  @ApiOkResponse({
    description: 'Successfully fetched users',
    type: FindAllUsersResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching users',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() request: Request,
    @Query() filters: UserFilterDto,
  ): Promise<PaginationResponseTypeDto<FindAllUsersResponseDataDto>> {
    const userUid = request['user'].uid;
    const data = await this.usersService.findAll(filters, userUid);

    return {
      data,
      message: 'Users fetched successfully',
    };
  }

  @Get(':uid')
  @Protected()
  @ApiOperation({
    summary: 'get user by uid requires to be connected',
  })
  @ApiOkResponse({
    description: 'Successfully fetched user',
    type: FindOneUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  async findOne(
    @Param('uid') uid: string,
    @Req() request: FastifyRequest,
  ): Promise<ResponseTypeDto<FindOneUserResponseData>> {
    const searcherUid = request['user'].uid;
    const data = await this.usersService.findOne(uid, USERSELECT.findOne, searcherUid);

    if (!data) {
      throw new NotFoundException('User not found');
    }
    const user = UserMapper.toFindOneResponseDto(data as unknown as RawUserFindOne);
    return { data: user, message: 'User fetched successfully' };
  }

  @Get('/')
  @Protected()
  @ApiOperation({
    summary: 'get user by token requires to be connected',
  })
  @ApiOkResponse({
    description: 'Successfully fetched user',
    type: FindMeUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async findMe(@Req() request: Request): Promise<ResponseTypeDto<FindMeUserResponseData>> {
    const uid = request['user'].uid;

    const data = await this.usersService.findOne(uid, USERSELECT.findMe);

    if (!data) {
      throw new NotFoundException('User not found');
    }
    const user = UserMapper.toFindMeResponseDto(data as unknown as RawUserFindMe);

    return { data: user, message: 'User fetched successfully' };
  }

  @Get('/email/:email')
  @Protected()
  @ApiOperation({
    summary: 'get user by email',
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async findOneByEmail(@Param('email') email: string): Promise<ResponseTypeDto<Users>> {
    const data = await this.usersService.findOneByEmail(email);
    if (!data) {
      throw new NotFoundException(`Error finding user by email: ${email}`);
    }

    return { data, message: 'User fetched successfully' };
  }

  @Patch('/update')
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Protected()
  @ApiOperation({
    summary: 'update user requires to be connected, does not update the password',
  })
  @ApiBadRequestResponse({
    description: 'Error updating user',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'User updated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Req() request: Request,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFilesCustom() files?: { buffer: Buffer; originalname: string }[],
  ): Promise<void> {
    const file = Array.isArray(files) ? files[0] : files;
    let createImageDto: CreateImageDto | undefined;
    if (file?.buffer && file?.originalname) {
      createImageDto = {
        file: file.buffer,
        name: file.originalname,
      };
    }
    const uid = request['user'].uid;
    await this.usersService.update(uid, updateUserDto, createImageDto);
    return;
  }

  @Patch('/update-password')
  @Protected()
  @ApiOperation({
    summary: 'update password requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error updating password',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'Password updated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  updatePassword(
    @Req() request: Request,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const uid = request['user'].uid;
    return this.usersService.updatePassword(uid, updatePasswordDto);
  }

  @Patch('/update-email')
  @Protected()
  @ApiOperation({
    summary: 'update email requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error updating email',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'Email updated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  updateEmail(
    @Req() request: Request,
    @Body() updateUserEmailDto: UpdateUserEmailDto,
  ): Promise<void> {
    const uid = request['user'].uid;
    return this.usersService.updateEmail(uid, updateUserEmailDto.email);
  }

  @Patch('/deactivate')
  @Protected()
  @ApiOperation({
    summary: 'deactivate user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error deactivating user',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'User deactivated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.deactivate(uid);
  }

  @Patch('/request-deletion')
  @Protected()
  @ApiOperation({
    summary:
      'request deletion of user, the deletion will be processed after a 30 days retraction period',
  })
  @ApiBadRequestResponse({
    description: 'Error requesting deletion',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found', type: NotFoundResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'User deletion request sent successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deletionRequest(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.deletionRequest(uid);
  }

  @Patch('/cancel-deletion-request')
  @Protected()
  @ApiOperation({
    summary: 'cancel deletion request of user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error canceling deletion request',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found', type: NotFoundResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({ description: 'User deletion request canceled successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelDeletionRequest(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.cancelDeletionRequest(uid);
  }
}

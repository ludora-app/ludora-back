import { Users } from 'generated/prisma/client';
import { Public } from 'src/shared/decorators/public.decorator';
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
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { USERSELECT } from '../shared/constants/select-user';
import { ForgottenPasswordDto } from './dto/input/forgotten-password.dto';
import { PasswordResetRequestDto } from './dto/input/password-reset-request.dto';
import {
  FindAllUsersResponseDataDto,
  FindAllUsersResponseDto,
  FindMeUserResponseDto,
  FindOneUserResponseDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserFilterDto,
} from './dto';

@Controller('users')
@UseGuards(AuthB2CGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/list/collection')
  @Protected()
  @ApiOperation({
    summary: 'Récupère tous les utilisateurs',
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
    @Query() filters: UserFilterDto,
  ): Promise<PaginationResponseTypeDto<FindAllUsersResponseDataDto>> {
    const data = await this.usersService.findAll(filters);

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
  @Public()
  async findOne(@Param('uid') uid: string): Promise<ResponseTypeDto<Users>> {
    const data = await this.usersService.findOne(uid, USERSELECT.findOne);

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return { data, message: 'User fetched successfully' };
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
  async findMe(@Req() request: Request): Promise<ResponseTypeDto<Users>> {
    const uid = request['user'].uid;

    const data = await this.usersService.findOne(uid, USERSELECT.findMe);

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return { data, message: 'User fetched successfully' };
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
  async update(@Req() request: Request, @Body() updateUserDto: UpdateUserDto): Promise<void> {
    const uid = request['user'].uid;
    await this.usersService.update(uid, updateUserDto);
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

  @Delete('/delete')
  @Protected()
  @ApiOperation({
    summary: 'delete user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error deleting user',
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
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.remove(uid);
  }

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

  @Patch('/password-reset')
  @Protected()
  @ApiOperation({
    summary: 'This method is used to reset the password of a user when he forgot his password',
  })
  @ApiBadRequestResponse({
    description: 'Error resetting password',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Verification code not found',
    type: NotFoundResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordReset(@Body() dto: ForgottenPasswordDto, @Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.usersService.resetForgottenPassword(dto.newPassword, userUid);
    return;
  }
}

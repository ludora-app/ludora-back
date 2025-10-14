import { Users } from '@prisma/client';
import { Public } from 'src/auth/decorators/public.decorator';
import { ResponseTypeDto } from 'src/interfaces/response-type';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { USERSELECT } from '../shared/constants/select-user';
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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/all')
  @ApiOperation({
    summary: 'Récupère tous les utilisateurs',
  })
  @ApiOkResponse({
    description: 'Successfully fetched users',
    type: FindAllUsersResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching users',
    type: BadRequestException,
  })
  async findAll(
    @Query() filters: UserFilterDto,
  ): Promise<PaginationResponseTypeDto<FindAllUsersResponseDataDto>> {
    const data = await this.usersService.findAll(filters);

    return {
      data,
      message: 'Users fetched successfully',
      status: 200,
    };
  }

  @Get(':uid')
  @ApiOperation({
    summary: 'get user by uid requires to be connected',
  })
  @ApiOkResponse({
    description: 'Successfully fetched user',
    type: FindOneUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  @Public()
  async findOne(@Param('uid') uid: string): Promise<ResponseTypeDto<Users>> {
    const data = await this.usersService.findOne(uid, USERSELECT.findOne);

    if (!data) {
      throw new NotFoundException('User not found');
    }

    return { data, message: 'User fetched successfully', status: 200 };
  }

  @Get('/')
  @ApiOperation({
    summary: 'get user by token requires to be connected',
  })
  @ApiOkResponse({
    description: 'Successfully fetched user',
    type: FindMeUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  async findMe(@Req() request: Request): Promise<ResponseTypeDto<Users>> {
    const uid = request['user'].uid;

    const data = await this.usersService.findOne(uid, USERSELECT.findMe);

    return { data, message: 'User fetched successfully', status: 200 };
  }

  @Get('/email/:email')
  @ApiOperation({
    summary: 'get user by email',
  })
  @ApiBadRequestResponse({
    description: 'Error fetching user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  async findOneByEmail(@Param('email') email: string): Promise<ResponseTypeDto<Users>> {
    const data = await this.usersService.findOneByEmail(email);
    if (!data) {
      throw new NotFoundException(`Error finding user by email: ${email}`);
    }

    return { data, message: 'User fetched successfully', status: 200 };
  }

  @Patch('/update')
  @ApiOperation({
    summary: 'update user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error updating user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  @ApiNoContentResponse({ description: 'User updated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Req() request: Request, @Body() updateUserDto: UpdateUserDto): Promise<void> {
    const uid = request['user'].uid;
    await this.usersService.update(uid, updateUserDto);
    return;
  }

  @Patch('/update-password')
  @ApiOperation({
    summary: 'update password requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error updating password',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
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
  @ApiOperation({
    summary: 'deactivate user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error deactivating user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  @ApiNoContentResponse({ description: 'User deactivated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.deactivate(uid);
  }

  @Delete('/delete')
  @ApiOperation({
    summary: 'delete user requires to be connected',
  })
  @ApiBadRequestResponse({
    description: 'Error deleting user',
    type: BadRequestException,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundException,
  })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() request: Request) {
    const uid = request['user'].uid;
    return this.usersService.remove(uid);
  }
}

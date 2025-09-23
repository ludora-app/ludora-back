import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Users } from '@prisma/client';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import { ResponseTypeDto } from 'src/interfaces/response-type';

import { Public } from 'src/auth/decorators/public.decorator';
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
import { UsersService } from './users.service';

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

  @Get(':id')
  @ApiOperation({
    summary: 'get user by id requires to be connected',
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
  async findOne(@Param('id') id: string): Promise<ResponseTypeDto<Users>> {
    const data = await this.usersService.findOne(id, USERSELECT.findOne);

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
    const id = request['user'].id;

    const data = await this.usersService.findOne(id, USERSELECT.findMe);

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
  async update(
    @Req() request: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseTypeDto<Users>> {
    const id = request['user'].id;
    const data = await this.usersService.update(id, updateUserDto);
    return { data, message: 'User updated successfully', status: 200 };
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
  updatePassword(@Req() request: Request, @Body() updatePasswordDto: UpdatePasswordDto) {
    const id = request['user'].id;
    return this.usersService.updatePassword(id, updatePasswordDto);
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
  deactivate(@Req() request: Request) {
    const id = request['user'].id;
    return this.usersService.deactivate(id);
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
  remove(@Req() request: Request) {
    const id = request['user'].id;
    return this.usersService.remove(id);
  }
}

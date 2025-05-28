import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { UsersService } from './users.service';
import {
  UpdatePasswordDto,
  UserFilterDto,
  FindMeUserResponseDto,
  FindOneUserResponseDto,
  UpdateUserDto,
  FindAllUsersResponseDto,
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
  findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
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
  findOne(@Param('id') id: string) {
    const select = {
      bio: true,
      firstname: true,
      id: true,
      imageUrl: true,
      lastname: true,
      name: true,
    };

    return this.usersService.findOne(id, select);
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
  findMe(@Req() request: Request) {
    const id = request['user'].id;

    const select = {
      active: true,
      bio: true,
      birthdate: true,
      email: true,
      firstname: true,
      id: true,
      imageUrl: true,
      lastname: true,
      name: true,
      phone: true,
      sex: true,
      stripe_account_id: true,
      type: true,
    };

    return this.usersService.findOne(id, select);
  }

  @Get('/email')
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
  async findOneByEmail(@Body('email') email: string) {
    return this.usersService.findOneByEmail(email);
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
  update(@Req() request: Request, @Body() updateUserDto: UpdateUserDto) {
    const id = request['user'].id;
    return this.usersService.update(id, updateUserDto);
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

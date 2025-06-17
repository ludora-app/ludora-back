import { UsersService } from 'src/users/application/services/users.service';
import { UserNotFoundDomainError } from 'src/users/domain/errors/user-not-found.error';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  Controller,
  Body,
  Post,
  Get,
  BadRequestException,
  NotFoundException,
  Param,
} from '@nestjs/common';

import { CreateUserDto } from '../dtos/input/create-user.dto';
import { UserPresentationMapper } from '../mappers/user-presentation.mapper';
import { FindOneUserResponseDto } from '../dtos/output/find-one-user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  register(@Body() dto: CreateUserDto) {
    console.log('dto from controller', dto);
    return this.usersService.save(dto);
  }

  // @Get('/all')
  // @ApiOperation({
  //   summary: 'Récupère tous les utilisateurs',
  // })
  // @ApiOkResponse({
  //   description: 'Successfully fetched users',
  //   type: FindAllUsersResponseDto,
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error fetching users',
  //   type: BadRequestException,
  // })
  // findAll(@Query() filters: UserFilterDto) {
  //   return this.usersService.findAll(filters);
  // }

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
  async findOne(@Param('id') id: string): Promise<FindOneUserResponseDto> {
    try {
      const user = await this.usersService.findById(id);
      return {
        data: UserPresentationMapper.toFindOneUserResponse(user),
        message: 'User fetched successfully',
        status: 200,
      };
    } catch (error) {
      if (error instanceof UserNotFoundDomainError) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }

  // @Get('/')
  // @ApiOperation({
  //   summary: 'get user by token requires to be connected',
  // })
  // @ApiOkResponse({
  //   description: 'Successfully fetched user',
  //   type: FindMeUserResponseDto,
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error fetching user',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // findMe(@Req() request: Request) {
  //   const id = request['user'].id;

  //   const select = {
  //     active: true,
  //     bio: true,
  //     birthdate: true,
  //     email: true,
  //     firstname: true,
  //     id: true,
  //     imageUrl: true,
  //     lastname: true,
  //     name: true,
  //     phone: true,
  //     sex: true,
  //     stripe_account_id: true,
  //     type: true,
  //   };

  //   return this.usersService.findOne(id, select);
  // }

  // @Get('/email')
  // @ApiOperation({
  //   summary: 'get user by email',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error fetching user',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // async findOneByEmail(@Body('email') email: string) {
  //   return this.usersService.findOneByEmail(email);
  // }

  // @Patch('/update')
  // @ApiOperation({
  //   summary: 'update user requires to be connected',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error updating user',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // update(@Req() request: Request, @Body() updateUserDto: UpdateUserDto) {
  //   const id = request['user'].id;
  //   return this.usersService.update(id, updateUserDto);
  // }

  // @Patch('/update-password')
  // @ApiOperation({
  //   summary: 'update password requires to be connected',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error updating password',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // updatePassword(@Req() request: Request, @Body() updatePasswordDto: UpdatePasswordDto) {
  //   const id = request['user'].id;
  //   return this.usersService.updatePassword(id, updatePasswordDto);
  // }

  // @Patch('/deactivate')
  // @ApiOperation({
  //   summary: 'deactivate user requires to be connected',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error deactivating user',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // deactivate(@Req() request: Request) {
  //   const id = request['user'].id;
  //   return this.usersService.deactivate(id);
  // }

  // @Delete('/delete')
  // @ApiOperation({
  //   summary: 'delete user requires to be connected',
  // })
  // @ApiBadRequestResponse({
  //   description: 'Error deleting user',
  //   type: BadRequestException,
  // })
  // @ApiNotFoundResponse({
  //   description: 'User not found',
  //   type: NotFoundException,
  // })
  // remove(@Req() request: Request) {
  //   const id = request['user'].id;
  //   return this.usersService.remove(id);
  // }
}

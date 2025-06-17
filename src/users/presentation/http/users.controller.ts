// import { AuthGuard } from 'src/auth/guards/auth.guard';
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
  Req,
  Query,
  // UseGuards,
} from '@nestjs/common';

import { CreateUserDto } from '../dtos/input/create-user.dto';
import { UserFilterDto } from '../dtos/input/user-filter.dto';
import { UserPresentationMapper } from '../mappers/user-presentation.mapper';
import { FindAllUsersResponseDto } from '../dtos/output/find-all-users-response.dto';
import {
  FindMeUserResponseDto,
  FindOneUserResponseDto,
} from '../dtos/output/find-one-user-response.dto';

// @UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  register(@Body() dto: CreateUserDto) {
    return this.usersService.save(dto);
  }

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
  async findAll(@Query() filters: UserFilterDto) {
    const users = await this.usersService.findAll(filters);
    return UserPresentationMapper.toFindAllUsersResponse(users);
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
  async findMe(@Req() request: Request) {
    const id = request['user'].id;

    try {
      const user = await this.usersService.findById(id);
      return {
        data: UserPresentationMapper.toFindMeUserResponse(user),
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
  async findOneByEmail(@Param('email') email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
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

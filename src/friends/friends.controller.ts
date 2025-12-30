import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FriendsService } from './friends.service';
import { UpdateFriendDto } from './dto/input/update-friend.dto';
import { CreateFriendDto } from './dto/input/create-friend.dto';
import { FriendResponseDto } from './dto/output/friend-response.dto';

@Controller('friends')
@UseGuards(AuthB2CGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new friend request' })
  @ApiCreatedResponse({ type: ResponseTypeDto<FriendResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createFriendDto: CreateFriendDto,
    @Req() req: Request,
  ): Promise<ResponseTypeDto<FriendResponseDto>> {
    const senderUid = req['user'].uid;
    const friendRequest = await this.friendsService.create(senderUid, createFriendDto.receiverUid);
    return {
      data: friendRequest,
      message: 'Friend request created successfully',
    };
  }

  @Get()
  findAll() {
    return this.friendsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.friendsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFriendDto: UpdateFriendDto) {
    return this.friendsService.update(+id, updateFriendDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.friendsService.remove(+id);
  }
}

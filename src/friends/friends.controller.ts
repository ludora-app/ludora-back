import { UserFilterDto } from 'src/users/dto';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ConflictResponseDto } from 'src/shared/dto/errors/conflict-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { FriendsService } from './friends.service';
import { UpdateFriendDto } from './dto/input/update-friend.dto';
import { CreateFriendDto } from './dto/input/create-friend.dto';
import { FriendFilterDto } from './dto/input/friend-filter.dto';
import {
  FriendResponseData,
  FriendResponseDto,
  PaginatedFriendResponse,
} from './dto/output/friend-response.dto';
import {
  FriendRequestResponseData,
  PaginatedFriendRequestResponse,
} from './dto/output/friend-request-response.dto';

@Controller('friends')
@UseGuards(AuthB2CGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new friend request at the PENDING status' })
  @ApiNoContentResponse({ description: 'Friend request created successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiConflictResponse({ type: ConflictResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(@Body() createFriendDto: CreateFriendDto, @Req() req: Request): Promise<void> {
    const senderUid = req['user'].uid;
    await this.friendsService.create(senderUid, createFriendDto.receiverUid);
    return;
  }

  @Get('my-friends-collection')
  @Protected()
  @ApiOperation({ summary: 'Get all friends of the connected user' })
  @ApiOkResponse({ type: PaginatedFriendResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllMyFriends(
    @Query() filters: FriendFilterDto,
    @Req() req: Request,
  ): Promise<PaginationResponseTypeDto<FriendResponseData>> {
    const userUid = req['user'].uid;
    const friends = await this.friendsService.findAllMyFriends(filters, userUid);
    return {
      data: friends,
      message: 'Friends fetched successfully',
    };
  }

  @Get('my-requests-collection')
  @Protected()
  @ApiOperation({ summary: 'Get all friend requests of the connected user' })
  @ApiOkResponse({ type: PaginatedFriendRequestResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllMyRequests(
    @Query() filters: UserFilterDto,
    @Req() req: Request,
  ): Promise<PaginationResponseTypeDto<FriendRequestResponseData>> {
    const userUid = req['user'].uid;
    const friends = await this.friendsService.findAllMyRequests(filters, userUid);
    return {
      data: friends,
      message: 'Friend requests fetched successfully',
    };
  }

  @Get('my-friend-request/:otherUserUid')
  @Protected()
  @ApiOperation({ summary: 'Get a friend request between the connected user and the receiver' })
  @ApiOkResponse({ type: FriendResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMyFriendRequest(
    @Param('otherUserUid') otherUserUid: string,
    @Req() req: Request,
  ): Promise<ResponseTypeDto<FriendResponseData>> {
    const connectedUserUid = req['user'].uid;
    const friendRequest = await this.friendsService.findOne(connectedUserUid, otherUserUid);

    return {
      data: friendRequest,
      message: 'Friend request fetched successfully',
    };
  }

  @Patch(':userUid')
  @Protected()
  @ApiOperation({ summary: 'Update a friend request between the connected user and the receiver' })
  @ApiNoContentResponse({ description: 'Friend request updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @Param('userUid') userUid: string,
    @Body() updateFriendDto: UpdateFriendDto,
    @Req() req: Request,
  ): Promise<void> {
    const connectedUserUid = req['user'].uid;
    return this.friendsService.update(connectedUserUid, userUid, updateFriendDto.status);
  }

  @Delete(':otherUserUid')
  @Protected()
  @ApiOperation({ summary: 'Remove an existing friend (ACCEPTED status)' })
  @ApiNoContentResponse({ description: 'Friend removed successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('otherUserUid') otherUserUid: string, @Req() req: Request): Promise<void> {
    const connectedUserUid = req['user'].uid;
    return this.friendsService.remove(connectedUserUid, otherUserUid);
  }
}

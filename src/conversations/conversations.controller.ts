import { FastifyRequest } from 'fastify';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { ForbiddenResponseDto } from 'src/shared/dto/errors/forbidden-response.dto';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  Patch,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { MessagesService } from './services/messages.service';
import { CreateMessageDto } from './dto/input/create-message.dto';
import { ConversationsService } from './services/conversations.service';
import { ConversationFilterDto } from './dto/input/conversation-filter.dto';
import { ConversationMembersService } from './services/conversation-members.service';
import { ConversationMembershipGuard } from './guards/conversation-membership.guard';
import { FindOneConversationByUserUidResponseDto } from './dto/output/find-one-conversation-by-user-uid-response.dto';
import {
  ArchivedConversationSettingsDto,
  MutedConversationSettingsDto,
} from './dto/input/update-conversation-settings.dto';
import {
  MessageCollectionItemDto,
  PaginatedMessageCollectionResponseDto,
} from './dto/output/message-collection-response.dto';
import {
  FindOneConversationResponseData,
  FindOneConversationResponseDto,
} from './dto/output/find-one-conversation-response.dto';
import {
  ConversationMemberResponseData,
  PaginatedConversationMemberResponseDto,
} from './dto/output/conversation-member-response.dto';
import {
  ConversationCollectionResponseData,
  PaginatedConversationCollectionResponseDto,
} from './dto/output/conversation-collection-response.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly membersService: ConversationMembersService,
    private readonly messagesService: MessagesService,
  ) {}

  // @Post()
  // create(@Body() createConversationDto: CreatePrivateConversationDto) {
  //   return this.conversationsService.create(createConversationDto);
  // }

  @Post()
  @Protected()
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiNoContentResponse({ description: 'Message created successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiOperation({ summary: 'Create a message' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createMessage(
    @Req() request: Request,
    @Body() dto: CreateMessageDto,
    @UploadedFilesCustom() files: { buffer: Buffer; originalname: string }[],
  ) {
    const userUid = request['user'].uid;

    if (dto.recipientUid && userUid === dto.recipientUid) {
      throw new BadRequestException('You cannot send a message to yourself');
    }

    const file = files && files.length > 0 ? files[0] : undefined;
    return this.conversationsService.createMessage(userUid, dto, file);
  }

  @Get('/list/collection')
  @Protected()
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiOkResponse({ type: PaginatedConversationCollectionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Query() filters: ConversationFilterDto,
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<ConversationCollectionResponseData>> {
    const userUid = request['user'].uid;
    const conversations = await this.conversationsService.findAllByUserUid(filters, userUid);
    return {
      data: conversations,
      message: 'Conversations fetched successfully',
    };
  }

  @Get(':uid')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({ summary: 'Get a conversation by uid' })
  @ApiOkResponse({ type: FindOneConversationResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('uid') uid: string,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<FindOneConversationResponseData>> {
    const userUid = request['user'].uid;
    const conversation = await this.conversationsService.findOne(uid, userUid);

    return {
      data: conversation,
      message: 'Conversation fetched successfully',
    };
  }

  @Get('user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get a conversation by user uids' })
  @ApiOkResponse({ type: FindOneConversationByUserUidResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findByUserUids(
    @Param('userUid') userUid: string,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<{ conversationUid: string }>> {
    const connectedUserUid = request['user'].uid;
    if (connectedUserUid === userUid) {
      throw new BadRequestException('Connected user uid and other user uid cannot be the same');
    }
    const conversation = await this.conversationsService.findByUserUids(connectedUserUid, userUid);
    return {
      data: conversation,
    };
  }

  @Get(':uid/messages-list/collection')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({ summary: 'Get a list of messages for a conversation' })
  @ApiOkResponse({ type: PaginatedMessageCollectionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiQuery({
    description: 'Cursor for pagination',
    name: 'cursor',
    required: false,
    type: String,
  })
  @ApiQuery({
    description: 'Limit of messages to return',
    name: 'limit',
    required: false,
    type: Number,
  })
  @HttpCode(HttpStatus.OK)
  async loadMoreMessages(
    @Param('uid') uid: string,
    @Req() request: Request,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ): Promise<PaginationResponseTypeDto<MessageCollectionItemDto>> {
    const userUid = request['user'].uid;
    const messages = await this.conversationsService.loadMoreMessages(uid, userUid, cursor, limit);
    return {
      data: messages,
      message: 'Messages fetched successfully',
    };
  }

  @Get(':uid/members')
  @ApiOperation({ summary: 'Get all members of a conversation' })
  @ApiOkResponse({ type: PaginatedConversationMemberResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @Protected()
  async findAllMembers(
    @Param('uid') uid: string,
  ): Promise<PaginationResponseTypeDto<ConversationMemberResponseData>> {
    const members = await this.membersService.findAllByConversationUid(uid);
    return {
      data: members,
      message: 'Members fetched successfully',
    };
  }

  @Patch('mute/:uid')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({ summary: "Update a conversation's mute settings" })
  @ApiNoContentResponse({ description: "Conversation's mute settings updated successfully" })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  updateMuteSettings(
    @Param('uid') conversationUid: string,
    @Req() request: FastifyRequest,
    @Body() settings: MutedConversationSettingsDto,
  ) {
    const userUid = request['user'].uid;
    return this.membersService.updateMuteSettings(conversationUid, userUid, settings);
  }

  @Patch('archive/:uid')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({ summary: "Update a conversation's archive settings" })
  @ApiNoContentResponse({ description: "Conversation's archive settings updated successfully" })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  updateArchivedSettings(
    @Param('uid') conversationUid: string,
    @Req() request: FastifyRequest,
    @Body() settings: ArchivedConversationSettingsDto,
  ) {
    const userUid = request['user'].uid;
    return this.membersService.updateArchivedSettings(conversationUid, userUid, settings);
  }

  @Delete(':uid')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({
    summary:
      'Soft delete a conversation, it updates the display messages after to the current date',
  })
  @ApiNoContentResponse({
    description: "Conversation's display messages after updated successfully",
  })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('uid') conversationUid: string, @Req() request: FastifyRequest) {
    const userUid = request['user'].uid;
    return this.membersService.updateDisplayMessagesAfterDeletion(conversationUid, userUid);
  }

  @Delete(':uid/messages/:messageUid')
  @UseGuards(ConversationMembershipGuard)
  @Protected()
  @ApiOperation({ summary: 'Delete a message from a conversation' })
  @ApiNoContentResponse({ description: 'Message deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('uid') _conversationUid: string,
    @Param('messageUid') messageUid: string,
    @Req() request: FastifyRequest,
  ) {
    const userUid = request['user'].uid;
    return this.messagesService.delete(messageUid, userUid);
  }
}

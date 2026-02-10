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
} from '@nestjs/common';
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

import { CreateMessageDto } from './dto/input/create-message.dto';
import { ConversationsService } from './services/conversations.service';
import { ConversationFilterDto } from './dto/input/conversation-filter.dto';
import {
  MessageCollectionItemDto,
  PaginatedMessageCollectionResponseDto,
} from './dto/output/message-collection-response.dto';
import {
  FindOneConversationResponseData,
  FindOneConversationResponseDto,
} from './dto/output/find-one-conversation-response.dto';
import {
  ConversationCollectionResponseData,
  PaginatedConversationCollectionResponseDto,
} from './dto/output/conversation-collection-response.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

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

  @Get(':uid/messages-list/collection')
  @Protected()
  @ApiOperation({ summary: 'Get a list of messages for a conversation' })
  @ApiOkResponse({ type: PaginatedMessageCollectionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit of messages to return',
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

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
  //   return this.conversationsService.update(+id, updateConversationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.conversationsService.remove(+id);
  // }
}

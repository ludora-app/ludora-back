import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { ForbiddenResponseDto } from 'src/shared/dto/errors/forbidden-response.dto';
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
  UseGuards,
  NotFoundException,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ConversationsService } from './conversations.service';
import { CreateMessageDto } from './dto/input/create-message.dto';
import { ConversationFilterDto } from './dto/input/conversation-filter.dto';
import {
  ConversationResponse,
  PaginatedConversationResponse,
} from './dto/output/conversation-response.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // @Post()
  // create(@Body() createConversationDto: CreateConversationDto) {
  //   return this.conversationsService.create(createConversationDto);
  // }

  @Post('/mock')
  @UseGuards(DevOnlyGuard)
  @Protected()
  @ApiOperation({ summary: 'DEV ONLY:Create mock conversations' })
  @ApiOkResponse({ type: ConversationResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async createMockConversation(@Req() request: Request) {
    const userUid = request['user'].uid;
    return this.conversationsService.createMockConversation(userUid);
  }

  @Get('/list/collection')
  @Protected()
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiOkResponse({ type: PaginatedConversationResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Query() filters: ConversationFilterDto,
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<ConversationResponse>> {
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
  @ApiOkResponse({ type: ConversationResponse })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiForbiddenResponse({ type: ForbiddenResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('uid') uid: string, @Req() request: Request) {
    const userUid = request['user'].uid;
    const conversation = await this.conversationsService.findOne(uid, userUid);

    if (!conversation) {
      throw new NotFoundException(`Conversation with uid ${uid} not found`);
    }

    return {
      data: conversation,
      message: 'Conversation fetched successfully',
    };
  }

  @Post(':conversationUid/messages')
  @Protected()
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async createMessage(
    @Req() request: Request,
    @Body() dto: CreateMessageDto,
    @Param('conversationUid') conversationUid: string,
  ) {
    const userUid = request['user'].uid;
    const { content, file, type } = dto;
    return this.conversationsService.createMessage(userUid, content, conversationUid, type, file);
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

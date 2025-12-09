import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
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
  UseGuards,
} from '@nestjs/common';

import { ConversationsService } from './conversations.service';
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
  findOne(@Param('uid') uid: string, @Req() request: Request) {
    const userUid = request['user'].uid;
    return this.conversationsService.findOne(uid, userUid);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
  //   return this.conversationsService.update(+id, updateConversationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.conversationsService.remove(+id);
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
}

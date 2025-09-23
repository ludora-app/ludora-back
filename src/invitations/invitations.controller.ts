import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';
import { CreateInvitationDto } from './dto/input/create-invitation.dto';
import { UpdateInvitationDto } from './dto/input/update-invitation.dto';
import { InvitationResponse } from './dto/output/invitation-response';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiOkResponse({ type: ResponseTypeDto<InvitationResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
  ): Promise<ResponseType<InvitationResponse>> {
    const invitation = await this.invitationsService.create(createInvitationDto);

    if (!invitation) {
      throw new BadRequestException('Failed to create invitation');
    }

    return {
      data: invitation,
      message: 'Invitation created successfully',
      status: 201,
    };
  }

  @Get()
  findAll() {
    return this.invitationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvitationDto: UpdateInvitationDto) {
    return this.invitationsService.update(+id, updateInvitationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(+id);
  }
}

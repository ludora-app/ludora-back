import { PartialType } from '@nestjs/swagger';
import { CreateInvitationDto } from './input/create-invitation.dto';

export class UpdateInvitationDto extends PartialType(CreateInvitationDto) {}

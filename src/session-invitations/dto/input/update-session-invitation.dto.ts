import { PartialType } from '@nestjs/swagger';
import { CreateSessionInvitationDto } from './create-session-invitation.dto';

export class UpdateSessionInvitationDto extends PartialType(CreateSessionInvitationDto) {}

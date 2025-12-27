import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinConversationDto {
  @IsUUID()
  @IsNotEmpty()
  conversationUid: string;
}

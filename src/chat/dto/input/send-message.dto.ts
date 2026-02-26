import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { MessageType } from 'generated/prisma/enums';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  conversationUid: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  @IsNotEmpty()
  type: MessageType;
}

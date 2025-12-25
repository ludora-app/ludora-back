import { MessageType } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

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

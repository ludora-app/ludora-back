import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';

export class TypingIndicatorDto {
  @IsUUID()
  @IsNotEmpty()
  conversationUid: string;

  @IsBoolean()
  @IsNotEmpty()
  isTyping: boolean;
}

import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConversationSettingsDto {
  @IsBoolean()
  @ApiProperty({
    description: 'Controls whether the conversation is archived',
    example: false,
    required: true,
  })
  isArchived: boolean;

  @IsBoolean()
  @ApiProperty({
    description: 'Controls whether the conversation is muted',
    example: false,
    required: true,
  })
  isMuted: boolean;
}

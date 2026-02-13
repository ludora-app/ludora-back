import { IsBoolean } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';

export class UpdateConversationSettingsDto {
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

export class ArchivedConversationSettingsDto extends PickType(UpdateConversationSettingsDto, [
  'isArchived',
]) {}

export class MutedConversationSettingsDto extends PickType(UpdateConversationSettingsDto, [
  'isMuted',
]) {}

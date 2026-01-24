import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateMessageDto {
  @ValidateIf((o) => o.type === MessageType.TEXT)
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Content of the message (text)',
    example: 'Hello, how are you?',
    required: false,
    type: String,
  })
  content?: string;

  @ApiProperty({
    description: 'Type of the message',
    enum: MessageType,
    example: MessageType.TEXT,
    required: true,
  })
  @IsEnum(MessageType)
  @IsNotEmpty()
  readonly type: MessageType;

  @ApiProperty({
    description: 'File image (message)',
    format: 'binary',
    required: false,
    type: 'string',
  })
  @ValidateIf((o) => o.type !== MessageType.TEXT)
  file?: any;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'For a group or (already existing) private conversation, the conversation uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  conversationUid?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'For a session conversation, the session uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  sessionUid?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'For a private conversation, the recipient uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  recipientUid?: string;
}

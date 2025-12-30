import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

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
}

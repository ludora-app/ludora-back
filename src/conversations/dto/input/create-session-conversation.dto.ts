import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionConversationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: "The name of the conversation, retrieved from the session's title",
    example: 'Session de football le 10/10/2025',
    required: true,
  })
  readonly name: string;

  @IsEnum(ConversationType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The type of the conversation',
    enum: ConversationType,
    example: ConversationType.SESSION,
    required: true,
  })
  readonly type: ConversationType = ConversationType.SESSION;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The users of the conversation',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  readonly userUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the session',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  readonly sessionUid: string;
}

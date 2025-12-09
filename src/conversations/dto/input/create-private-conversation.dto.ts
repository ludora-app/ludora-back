import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from 'generated/prisma/enums';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreatePrivateConversationDto {
  @IsEnum(ConversationType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The type of the conversation',
    example: ConversationType.PRIVATE,
    required: true,
  })
  readonly type: ConversationType = ConversationType.PRIVATE;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    description: 'The users of the conversation',
    example: ['cmajhjkjf000bq77q4b5ugn8b', 'cmajhjkjf000bq77q4b5ugn8b'],
    required: true,
  })
  readonly userUids: string[];
}

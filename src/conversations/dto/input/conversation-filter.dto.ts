import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ConversationType } from 'generated/prisma/enums';

export class ConversationFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Limit of conversations to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'fcacfaca3c2a323bhf',
    required: false,
    type: String,
  })
  cursor?: string;

  @IsOptional()
  @IsEnum(ConversationType)
  @ApiProperty({
    description: 'Type of conversation, used to filter my conversations',
    enum: ConversationType,
    enumName: 'ConversationType',
    required: false,
  })
  type?: ConversationType;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Name of the conversation',
    example: 'Group 1',
    required: false,
    type: String,
  })
  name?: string;
}

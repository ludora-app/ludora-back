import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BaseFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Number of results to return',
    example: 10,
    required: false,
    type: Number,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
    type: String,
  })
  cursor?: string;
}

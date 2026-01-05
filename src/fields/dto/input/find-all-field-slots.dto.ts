import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class FindAllFieldSlotsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Field uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  fieldUid: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Start date',
    example: '2026-01-05T10:00:00Z',
  })
  startDate: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { GameModes } from 'generated/prisma/enums';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFieldSlotDto {
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
    description: 'Start time of the slot',
    example: '2026-01-05T10:00:00Z',
  })
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'End time of the slot',
    example: '2026-01-05T11:00:00Z',
  })
  endTime: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Price of the slot',
    example: 25.5,
  })
  price: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Game mode (e.g., FIVE_V_FIVE, THREE_V_THREE)',
    example: 'FIVE_V_FIVE',
  })
  gameMode: GameModes;
}

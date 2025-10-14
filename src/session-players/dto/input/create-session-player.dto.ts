import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionPlayerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the team',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  teamUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  userUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the session',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  sessionUid: string;
}

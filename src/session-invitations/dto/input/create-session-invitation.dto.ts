import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionInvitationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Session ID',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  userId: string;
}

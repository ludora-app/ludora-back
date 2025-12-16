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
  sessionUid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User UID of the person who is being invited',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  receiverUid: string;
}

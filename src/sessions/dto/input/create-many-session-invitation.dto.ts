import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateManySessionInvitationDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  @ApiProperty({
    description: 'User UIDs of the people who are being invited',
    example: ['cmajhjkjf000bq77q4b5ugn8b', 'cmajhjkjf000bq77q4b5ugn8b'],
  })
  receiverUids: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFriendDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user who is receiving the friend request',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  receiverUid: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UserFilterDto } from 'src/users/dto/input/user-filter.dto';

export class FriendFilterDto extends UserFilterDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Session UID to check if the friends have been invited to the session',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  sessionUid?: string;
}

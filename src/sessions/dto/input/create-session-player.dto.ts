import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

export class JoinSessionDto extends OmitType(CreateSessionPlayerDto, ['userUid', 'teamUid']) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The uid of the team to join. When omitted, the team that needs the most players is picked',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: false,
  })
  teamUid?: string;
}

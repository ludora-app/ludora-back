import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { IsEnum, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateUserSportPreferenceDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(Sport)
  @ApiProperty({
    description: 'The sport that the user wants to register as a preference',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  readonly sport: string;

  @IsEnum(UserSportLevel)
  @Min(UserSportLevel.BEGINNER)
  @Max(UserSportLevel.ADVANCED)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The level of the user for the sport, from 1 to 3',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  readonly level: UserSportLevel;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    required: true,
  })
  userUid: string;
}

export class CreateUserSportPreferenceDtoFromRequest extends OmitType(
  CreateUserSportPreferenceDto,
  ['userUid'],
) {}

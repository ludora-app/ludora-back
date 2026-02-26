import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsString, Max, Min, ValidateNested } from 'class-validator';
import { GameModes } from 'generated/prisma/enums';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';

export class CreateSportPreferenceData {
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
  // @Transform(({ value }) => Number(value))
  // @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The level of the user for the sport, from 1 to 3',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  readonly level: UserSportLevel;

  @IsEnum(GameModes, { each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'The game mode which the user prefers',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
    isArray: true,
  })
  gameModes: GameModes[];
}

export class CreateSportPreferenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSportPreferenceData)
  @ApiProperty({
    description: 'The sport preferences of the user',
    type: [CreateSportPreferenceData],
  })
  sportPreferences: CreateSportPreferenceData[];
}

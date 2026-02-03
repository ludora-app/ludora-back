import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateGameModePreferencesDto {
  @IsEnum(GameModes)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The game mode which the user prefers',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
  })
  gameMode: GameModes;

  @IsEnum(Sport)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The sport which the user wants to play in the game mode',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  sport: Sport;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the user',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
  })
  userUid: string;
}

export class CreateGameModePreferencesDtoFromRequest extends OmitType(
  CreateGameModePreferencesDto,
  ['userUid'],
) {}

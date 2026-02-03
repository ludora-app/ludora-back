import { GameModes } from 'generated/prisma/enums';
import { IsEnum, IsOptional } from 'class-validator';
import { Sport } from 'src/shared/constants/constants';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

import { CreateGameModePreferencesDto } from './create-game-mode-preferences.dto';

export class UpdateGameModePreferenceDto extends PartialType(
  OmitType(CreateGameModePreferencesDto, ['userUid']),
) {
  @IsEnum(GameModes)
  @IsOptional()
  @ApiProperty({
    description: 'The game mode of the user game mode preference',
    enum: GameModes,
    example: GameModes.THREE_V_THREE,
  })
  gameMode?: GameModes;

  @IsEnum(Sport)
  @IsOptional()
  @ApiProperty({
    description: 'The sport of the user game mode preference',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  sport?: Sport;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

import { CreateSportWithGameModePreferenceDto } from './create-sport-preference.dto';

export class CreateAllPreferencesDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @ApiProperty({
    description: 'The sport preferences of the user',
    type: [CreateSportWithGameModePreferenceDto],
  })
  sportPreferences: CreateSportWithGameModePreferenceDto[];
}

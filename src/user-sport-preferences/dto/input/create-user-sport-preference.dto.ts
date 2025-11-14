import { ApiProperty } from '@nestjs/swagger';
import { Sport } from 'src/shared/constants/constants';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

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
}

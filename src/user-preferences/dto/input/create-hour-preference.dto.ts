import { ApiProperty } from '@nestjs/swagger';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';
import { IsDateString, IsEnum, IsNumber, Max, Min, ValidateIf } from 'class-validator';

export class CreateHourPreferenceDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  @ApiProperty({ description: 'The day of the week, 0 is Sunday, 6 is Saturday', example: 0 })
  @ValidateIf((o) => o.preferenceType === UserHourPreferenceType.RECURRENT)
  dayOfWeek?: number;

  @IsEnum(TimePeriod)
  @ApiProperty({
    description: 'The time period',
    enum: TimePeriod,
    example: TimePeriod.MORNING,
  })
  timePeriod: TimePeriod;

  @IsEnum(UserHourPreferenceType)
  @ApiProperty({
    description:
      'The preference type, RECURRENT is a recurring preference, ONE_TIME is a one time preference',
    enum: UserHourPreferenceType,
    example: UserHourPreferenceType.RECURRENT,
  })
  preferenceType: UserHourPreferenceType;

  @ValidateIf((o) => o.preferenceType === UserHourPreferenceType.ONE_TIME)
  @IsDateString()
  @ApiProperty({
    description: 'The date of the preference',
    example: '2025-05-10T22:30:32.525Z',
  })
  date?: string;
}

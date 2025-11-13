import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { TimePeriod, UserHourPreferenceType } from '@prisma/client';

export class CreateUserHourPreferenceDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  @ApiProperty({ description: 'The day of the week, 0 is Sunday, 6 is Saturday', example: 0 })
  dayOfWeek: number;

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
}

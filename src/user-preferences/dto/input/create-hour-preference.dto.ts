import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';

export class HourPreferenceData {
  @IsNumber()
  @Min(0)
  @Max(6)
  @ApiProperty({
    description: 'The day of the week, 0 is Sunday, 6 is Saturday',
    example: 0,
    required: true,
  })
  @ValidateIf((o) => o.type === UserHourPreferenceType.RECURRENT)
  @IsNotEmpty()
  dayOfWeek?: number;

  @IsEnum(TimePeriod)
  @ApiProperty({
    description: 'The time period',
    enum: TimePeriod,
    example: TimePeriod.MORNING,
    required: true,
  })
  @IsNotEmpty()
  timePeriod: TimePeriod;

  @IsEnum(UserHourPreferenceType)
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The preference type, RECURRENT is a recurring preference, ONE_TIME is a one time preference',
    enum: UserHourPreferenceType,
    example: UserHourPreferenceType.RECURRENT,
    required: true,
  })
  type: UserHourPreferenceType;

  @ValidateIf((o) => o.type === UserHourPreferenceType.ONE_TIME)
  @IsDateString()
  @ApiProperty({
    description: 'The date of the preference',
    example: '2025-05-10T22:30:32.525Z',
    nullable: true,
    required: false,
  })
  date?: Date;
}

export class CreateHourPreferenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HourPreferenceData)
  @ApiProperty({
    description: 'The hour preferences of the user',
    type: [HourPreferenceData],
  })
  hourPreferences: HourPreferenceData[];
}

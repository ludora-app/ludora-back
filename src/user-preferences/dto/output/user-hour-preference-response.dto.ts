import { ApiProperty } from '@nestjs/swagger';
import { TimePeriod, UserHourPreferenceType } from 'generated/prisma/client';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description standard response for a userHourPreference resource
 */
export class UserHourPreferenceResponseDto {
  @ApiProperty({
    description: "Entity's creation date",
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  createdAt: Date;

  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({
    enum: UserHourPreferenceType,
    example: UserHourPreferenceType.RECURRENT,
    readOnly: true,
  })
  readonly type: UserHourPreferenceType;

  @ApiProperty({ enum: TimePeriod, example: TimePeriod.MORNING, readOnly: true })
  readonly timePeriod: TimePeriod;

  @ApiProperty({
    description: 'The day of the week, 0 is Sunday, 6 is Saturday',
    example: 0,
    readOnly: true,
  })
  readonly dayOfWeek: number;

  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly userUid: string;

  @ApiProperty({
    description: 'Applicable date for a ONE_TIME preference, null for a RECURRENT preference',
    example: '2025-05-10T22:30:32.525Z',
    nullable: true,
    readOnly: true,
  })
  readonly date: Date | null;
}

/**
 * @description standard response for a paginated userHourPreference resource, used to type swagger return
 */
export const PaginatedUserHourPreferenceResponseDto = toPaginationResponseType(
  UserHourPreferenceResponseDto,
);

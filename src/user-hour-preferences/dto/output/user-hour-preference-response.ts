import { ApiProperty } from '@nestjs/swagger';
import { TimePeriod, UserHourPreferenceType } from '@prisma/client';

export class UserHourPreferenceResponse {
  @ApiProperty({
    description: 'Session creation date',
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

  @ApiProperty({ example: 0, readOnly: true })
  readonly dayOfWeek: number;

  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly userUid: string;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt: Date;
}

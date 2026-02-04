import { ApiProperty } from '@nestjs/swagger';
import { UserSportLevel } from 'src/shared/constants/constants';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description standard response for a userSportPreference resource
 */
export class SportPreferenceResponseData {
  @ApiProperty({ description: 'The unique identifier of the user sport preference' })
  uid: string;

  @ApiProperty({ description: 'The sport of the user sport preference' })
  sport: string;

  @ApiProperty({
    description: 'The level of the user sport preference',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  level: UserSportLevel;

  @ApiProperty({ description: 'The creation date of the user sport preference' })
  createdAt: Date;
}

export class SportPreferenceResponseDto extends ResponseTypeDto<SportPreferenceResponseData> {
  @ApiProperty({ type: SportPreferenceResponseData })
  readonly data: SportPreferenceResponseData;
}

/**
 * @description standard response for a paginated userSportPreference resource, used to type swagger return
 */
export const PaginatedSportPreferenceResponseDto = toPaginationResponseType(
  SportPreferenceResponseData,
);

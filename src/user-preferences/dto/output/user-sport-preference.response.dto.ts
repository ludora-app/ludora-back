import { ApiProperty } from '@nestjs/swagger';
import { UserSportLevel } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description standard response for a userSportPreference resource
 */
export class UserSportPreferenceResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user sport preference' })
  uid: string;

  @ApiProperty({ description: 'The sport of the user sport preference' })
  sport: string;

  @ApiProperty({ description: 'The user ID of the user sport preference' })
  userUid: string;

  @ApiProperty({
    description: 'The level of the user sport preference',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  level: UserSportLevel;

  @ApiProperty({ description: 'The creation date of the user sport preference' })
  createdAt: Date;
}

/**
 * @description standard response for a paginated userSportPreference resource, used to type swagger return
 */
export const PaginatedUserSportPreferenceResponseDto = toPaginationResponseType(
  UserSportPreferenceResponseDto,
);

import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description standard response for a userSportPreference resource
 */
export class UserSportPreferenceResponse {
  @ApiProperty({ description: 'The unique identifier of the user sport preference' })
  uid: string;

  @ApiProperty({ description: 'The sport of the user sport preference' })
  sport: string;

  @ApiProperty({ description: 'The user ID of the user sport preference' })
  userUid: string;

  @ApiProperty({ description: 'The creation date of the user sport preference' })
  createdAt: Date;

  @ApiProperty({ description: 'The update date of the user sport preference' })
  updatedAt: Date;
}

/**
 * @description standard response for a paginated userSportPreference resource, used to type swagger return
 */
export const PaginatedUserSportPreferenceResponse = PaginationResponseDto(
  UserSportPreferenceResponse,
);

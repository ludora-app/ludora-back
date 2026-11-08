import { ApiProperty } from '@nestjs/swagger';
import { UserSportLevel } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

/**
 * @description A player compatible with a session. The coordinates of the player are never
 * returned: only the distance between the center of their play area and the field, in whole km
 * so that several queries on different fields can't locate the center more precisely.
 */
export class CompatibleUserCollectionItemDto {
  @ApiProperty({ description: 'User ID', example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ description: 'First name', example: 'Léa', nullable: true, readOnly: true })
  readonly firstname: string | null;

  @ApiProperty({ description: 'Last name', example: 'Martin', nullable: true, readOnly: true })
  readonly lastname: string | null;

  @ApiProperty({
    description: 'Profile picture',
    example: 'https://example.com/image.jpg',
    nullable: true,
    readOnly: true,
  })
  readonly imageUrl: string | null;

  @ApiProperty({
    description: 'Level of the player for the sport of the session',
    enum: UserSportLevel,
    example: UserSportLevel.INTERMEDIATE,
    readOnly: true,
  })
  readonly level: UserSportLevel;

  @ApiProperty({
    description:
      'Distance in whole km (at least 1) between the center of the play area and the field (null without play area)',
    example: 3,
    nullable: true,
    readOnly: true,
  })
  readonly distance: number | null;
}

export const PaginatedCompatibleUserCollectionResponseDto = toPaginationResponseType(
  CompatibleUserCollectionItemDto,
);

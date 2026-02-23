import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/enums';
import { Sport, UserSportLevel } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class FindAllUserSportPreferenceResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the user sport preference',
    example: 'cm7hvgonx0000to0mh5maqajc',
  })
  uid: string;

  @ApiProperty({
    description: 'The sport of the user sport preference',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  sport: Sport;

  @ApiProperty({
    description: 'The level of the user sport preference',
    enum: UserSportLevel,
    example: UserSportLevel.BEGINNER,
  })
  level: UserSportLevel;
}

export class FindAllUsersResponseDataDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Toto', readOnly: true })
  readonly firstname: string;

  @ApiProperty({ example: 'Lolo', readOnly: true })
  readonly lastname: string;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly name?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true, readOnly: true })
  readonly imageUrl?: string;

  @ApiProperty({
    description: 'User bio',
    example: 'I love football and basketball',
    readOnly: true,
  })
  readonly bio?: string;

  @ApiProperty({
    description: 'Whether the user is in the same city as the connected user',
    example: true,
    readOnly: true,
  })
  readonly isSameCity?: boolean;

  @ApiProperty({
    description: 'User city',
    example: 'Paris',
    readOnly: true,
  })
  readonly userCity?: string;

  @ApiProperty({
    description: 'Sports in common with the connected user',
    enum: Sport,
    example: [Sport.BASKETBALL],
    isArray: true,
    readOnly: true,
  })
  readonly commonSports?: Sport[];

  @ApiProperty({
    isArray: true,
    nullable: true,
    readOnly: true,
    type: FindAllUserSportPreferenceResponseDto,
  })
  readonly sportPreferences?: FindAllUserSportPreferenceResponseDto[];

  @ApiProperty({
    description: 'Invitation status between the connected user and this user',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
    nullable: true,
    readOnly: true,
  })
  readonly invitationStatus?: InvitationStatus;
}

export const FindAllUsersResponseDto = toPaginationResponseType(FindAllUsersResponseDataDto);

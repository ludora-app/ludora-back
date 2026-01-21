import { FieldType } from 'generated/prisma/enums';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserSimpleDisplayDataDto } from 'src/users/dto';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { ImageResponseDto } from 'src/shared/images/dto/output/image-response.dto';

import { SessionTeamResponseData } from './session-team-response';
import { SessionCollectionItemDto } from './session-collection-response.dto';

export class SessionPlayerFromFindOneSessionResponseData extends UserSimpleDisplayDataDto {
  @ApiProperty({
    example: 'cmgoxfs3t002hob8arwdna80g',
    readOnly: true,
  })
  userUid: string;

  @ApiProperty({
    example: 'cmgoxfs47002zob8a42uq1u8z',
    readOnly: true,
  })
  teamUid: string;
}

export class TeamFromFindOneSessionResponseData {
  @ApiProperty({
    example: [
      {
        firstname: 'Seto',
        imageUrl: '1738433236109explore2.png',
        lastname: 'Kaiba',
        teamUid: 'cmgoxfs47002zob8a42uq1u8z',
        userUid: 'cmgoxfs3t002hob8arwdna80g',
      },
    ],
    readOnly: true,
  })
  sessionPlayers: SessionPlayerFromFindOneSessionResponseData[];

  @ApiProperty({
    description: 'Team name',
    example: 'Team A',
  })
  teamName: string;

  @ApiProperty({
    description: 'Whether the current user has joined this team',
    example: false,
    readOnly: true,
    required: false,
  })
  isJoined?: boolean;
}
export class CreatorInfoResponseData extends UserSimpleDisplayDataDto {
  @ApiProperty({
    description: 'Number of sessions organized by the creator',
    example: 5,
  })
  sessionsCount: number;
}

export class FindOneSessionResponseData extends OmitType(SessionCollectionItemDto, [
  'sessionTeams',
  'fieldImage',
]) {
  @ApiProperty({
    example: [
      {
        teamName: 'Team A',
      },
    ],
  })
  sessionTeams: SessionTeamResponseData[];

  @ApiProperty({
    description: 'The uid of the field',
    example: 'cmkiwtv9r02d65pmp40klxt2i',
  })
  fieldUid: string;

  fieldImages: ImageResponseDto[];

  @ApiProperty({
    description: 'The title of the session',
    example: 'Session 1',
  })
  title: string;

  @ApiProperty({ description: 'Session description', example: 'Test session' })
  description: string;

  @ApiProperty({
    description: 'The type of the field',
    enum: FieldType,
    example: FieldType.PUBLIC,
  })
  fieldType: FieldType;

  @ApiProperty({
    description: 'Whether the user is joined to the session',
    example: false,
  })
  isJoined: boolean;

  @ApiProperty({
    description: 'Creator information',
    required: false,
    type: CreatorInfoResponseData,
  })
  creator?: CreatorInfoResponseData;

  @ApiProperty({
    description: 'Total number of remaining available spots across all teams',
    example: 5,
    required: false,
  })
  remainingPlayers?: number;
}

export class FindOneSessionWithDistanceResponseData extends FindOneSessionResponseData {
  @ApiProperty({
    description: 'Distance to the session in kilometers',
    example: 1.2,
  })
  userDistance: number;
}

export class FindOneSessionResponseDto extends ResponseTypeDto<FindOneSessionResponseData> {
  @ApiProperty({ type: FindOneSessionResponseData })
  readonly data: FindOneSessionResponseData;
}

export class FindOneSessionWithDistanceResponseDto extends ResponseTypeDto<FindOneSessionWithDistanceResponseData> {
  @ApiProperty({ type: FindOneSessionWithDistanceResponseData })
  readonly data: FindOneSessionWithDistanceResponseData;
}

import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ImageResponseDto } from 'src/shared/images/dto/output/image-response.dto';

import { SessionTeamResponseData } from './session-team-response';
import { SessionCollectionItemDto } from './session-collection-response.dto';

export class SessionPlayerFromFindOneSessionResponseData {
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

  @ApiProperty({
    example: 'Seto',
    readOnly: true,
  })
  firstname: string;

  @ApiProperty({
    example: 'Kaiba',
    readOnly: true,
  })
  lastname: string;

  @ApiProperty({
    example: '1738433236109explore2.png',
    readOnly: true,
  })
  imageUrl: string | null;
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

  fieldImages: ImageResponseDto[];
}

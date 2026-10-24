import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class JoinSessionResponseData {
  @ApiProperty({
    description: 'The uid of the conversation associated with the session',
    example: 'cmkiwtv9r02d65pmp40klxt2i',
  })
  conversationUid: string;

  @ApiProperty({
    description: 'The uid of the session joined',
    example: 'cmkiwtv9r02d65pmp40klxt2i',
  })
  sessionUid: string;

  @ApiProperty({
    description: 'The uid of the team joined (picked by the API when none was sent)',
    example: 'cmkiwtv9r02d65pmp40klxt2i',
  })
  teamUid: string;
}

export class JoinSessionResponseDto extends ResponseTypeDto<JoinSessionResponseData> {
  @ApiProperty({ type: JoinSessionResponseData })
  readonly data: JoinSessionResponseData;
}

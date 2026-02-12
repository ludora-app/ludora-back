import { ApiProperty } from '@nestjs/swagger';
import { Sport } from 'src/shared/constants/constants';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

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
    example: ['BASKETBALL', 'FOOTBALL'],
    isArray: true,
    nullable: true,
    readOnly: true,
  })
  readonly sportPreferences?: Sport[];
}

export const FindAllUsersResponseDto = toPaginationResponseType(FindAllUsersResponseDataDto);

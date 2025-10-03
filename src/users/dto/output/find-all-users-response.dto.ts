import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

export class FindAllUsersResponseDataDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly id: string;

  @ApiProperty({ example: 'Toto', readOnly: true })
  readonly firstname: string;

  @ApiProperty({ example: 'Lolo', readOnly: true })
  readonly lastname: string;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  readonly name?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true, readOnly: true })
  readonly image_url?: string;
}

export const FindAllUsersResponseDto = PaginationResponseDto(FindAllUsersResponseDataDto);

import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared/dto/responses/pagination-response-type';

export class FieldResponseDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Field 1', readOnly: true })
  readonly name: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', readOnly: true })
  readonly address: string;

  @ApiProperty({ example: 48.8588443, readOnly: true })
  readonly latitude: number;

  @ApiProperty({ example: 2.2943506, readOnly: true })
  readonly longitude: number;

  @ApiProperty({ example: [{ order: 1, url: 'https://example.com/image.jpg' }], readOnly: true })
  readonly fieldImages?: FieldImageResponseDto[];
}

export class FieldImageResponseDto {
  @ApiProperty({ example: 1, readOnly: true })
  readonly order?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', readOnly: true })
  readonly url?: string;

  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid?: string;

  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly fieldUid?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', readOnly: true })
  readonly createdAt?: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', readOnly: true })
  readonly updatedAt?: Date;
}

export const PaginatedFieldResponse = PaginationResponseDto(FieldResponseDto);

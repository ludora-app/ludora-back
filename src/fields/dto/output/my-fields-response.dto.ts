import { VerificationStatus } from 'generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

import { FieldResponseDto } from './field-response.dto';

export class MyFieldsResponseData extends PickType(FieldResponseDto, [
  'uid',
  'name',
  'shortAddress',
  'sports',
]) {
  @ApiProperty({
    description: 'verification status',
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
  })
  readonly status: VerificationStatus;

  @ApiPropertyOptional({
    description: 'first image of the field',
    example: 'https://example.com/image.jpg',
  })
  readonly imageUrl?: string;

  @ApiProperty({ description: 'creation date', example: '2025-01-01T10:00:00.000Z' })
  readonly createdAt: Date;
}

export const PaginatedMyFieldsResponse = toPaginationResponseType(MyFieldsResponseData);

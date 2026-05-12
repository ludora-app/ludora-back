import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from 'generated/prisma/client';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { PublicFieldResponseData } from './field-response.dto';

export class AdminFieldCollectionResponseData extends PublicFieldResponseData {
  @ApiProperty({ enum: VerificationStatus, example: VerificationStatus.PENDING })
  status: VerificationStatus;

  @ApiProperty({
    description: 'first image of the field',
    example: 'https://example.com/image.jpg',
  })
  readonly image: string;
}

export const PaginatedAdminFieldResponse = toPaginationResponseType(
  AdminFieldCollectionResponseData,
);

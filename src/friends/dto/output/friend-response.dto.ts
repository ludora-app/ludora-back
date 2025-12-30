import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/enums';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class FriendResponseDto {
  @ApiProperty({
    description: 'Friend request creation date',
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Friend request update date',
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Friend request status',
    example: InvitationStatus.PENDING,
    readOnly: true,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'Friend request sender uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
  })
  userUid1: string;

  @ApiProperty({
    description: 'Friend request receiver uid',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
  })
  userUid2: string;
}

export const PaginatedFriendResponse = toPaginationResponseType(FriendResponseDto);

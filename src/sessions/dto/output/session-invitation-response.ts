import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/client';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class SessionInvitationResponseDto {
  @ApiProperty({
    description: "Session invitation's session ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionUid: string;

  @ApiProperty({
    description: "Session invitation's receiver ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  receiverUid: string;

  @ApiProperty({
    description: "Session invitation's sender ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  senderUid: string;

  @ApiProperty({
    description: "Session invitation's status",
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
    readOnly: true,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: "Session invitation's creation date",
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: "Session invitation's update date",
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt: Date;
}

/**
 * @description standard response for a paginated session invitation, used to type swagger return
 */
export const PaginatedSessionInvitationResponseDto = toPaginationResponseType(
  SessionInvitationResponseDto,
);

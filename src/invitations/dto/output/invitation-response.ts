import { ApiProperty } from '@nestjs/swagger';
import { Invitation_status } from '@prisma/client';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

export class InvitationResponse {
  @ApiProperty({
    description: "Invitation's session ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    description: "Invitation's user ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: "Invitation's status",
    example: Invitation_status.PENDING,
    readOnly: true,
    enum: Invitation_status,
  })
  status: Invitation_status;

  @ApiProperty({
    description: "Invitation's creation date",
    example: '2025-01-01T10:00:00.000Z',
    readOnly: true,
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: "Invitation's update date",
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt: Date;
}

/**
 * @description standard response for a paginated invitation, used to type swagger return
 */
export const PaginatedInvitationResponse = PaginationResponseDto(InvitationResponse);

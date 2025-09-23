import { ApiProperty } from '@nestjs/swagger';
import { Invitation_status } from '@prisma/client';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

export class SessionInvitationResponse {
  @ApiProperty({
    description: "Session invitation's session ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  sessionId: string;

  @ApiProperty({
    description: "Session invitation's user ID",
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: "Session invitation's status",
    example: Invitation_status.PENDING,
    readOnly: true,
    enum: Invitation_status,
  })
  status: Invitation_status;

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
export const PaginatedSessionInvitationResponse = PaginationResponseDto(SessionInvitationResponse);

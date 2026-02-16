import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export class FriendResponseData {
  @ApiProperty({
    description: 'Firstname of the friend',
    example: 'John',
    readOnly: true,
  })
  firstname: string;

  @ApiProperty({
    description: 'Lastname of the friend',
    example: 'Doe',
    readOnly: true,
  })
  lastname: string;

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
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
    readOnly: true,
  })
  status: InvitationStatus;

  @ApiProperty({
    description: 'User uid of the friend',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
  })
  friendUid: string;

  @ApiProperty({
    description: 'Friend request user profile picture',
    example: 'https://example.com/image.jpg',
    nullable: true,
    readOnly: true,
  })
  avatarUrl: string;

  @ApiProperty({
    description: 'If the friend has been invited to a session',
    example: true,
    readOnly: true,
  })
  isInvited?: boolean;
}

export class FriendResponseDto extends ResponseTypeDto<FriendResponseData> {
  @ApiProperty({ type: FriendResponseData })
  readonly data: FriendResponseData;
}

export const PaginatedFriendResponse = toPaginationResponseType(FriendResponseData);

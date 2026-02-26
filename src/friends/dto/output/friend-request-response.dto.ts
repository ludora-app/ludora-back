import { ApiProperty, OmitType } from '@nestjs/swagger';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { FriendResponseData } from './friend-response.dto';

export class FriendRequestResponseData extends OmitType(FriendResponseData, [
  'status',
  'friendUid',
  'isInvited',
]) {
  @ApiProperty({
    description: 'Sender uid of the friend request',
    example: 'cmajhjkjf000bq77q4b5ugn8b',
    readOnly: true,
  })
  senderUid: string;
}

export class FriendRequestResponseDto extends ResponseTypeDto<FriendRequestResponseData> {
  @ApiProperty({ type: FriendRequestResponseData })
  readonly data: FriendRequestResponseData;
}

export const PaginatedFriendRequestResponse = toPaginationResponseType(FriendRequestResponseData);

import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayWithUidData } from 'src/users/dto';

export const PaginatedBlockedUsersResponseDto = toPaginationResponseType(
  UserSimpleDisplayWithUidData,
);

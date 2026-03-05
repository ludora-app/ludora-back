import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayData } from 'src/users/dto';

export const PlayerSuggestionResponseDto = toPaginationResponseType(UserSimpleDisplayData);

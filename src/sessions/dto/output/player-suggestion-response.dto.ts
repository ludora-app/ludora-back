import { UserSimpleDisplayDataDto } from 'src/users/dto';
import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';

export const PlayerSuggestionResponseDto = toPaginationResponseType(UserSimpleDisplayDataDto);

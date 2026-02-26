import { toPaginationResponseType } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayDataDto } from 'src/users/dto';

export const PlayerSuggestionResponseDto = toPaginationResponseType(UserSimpleDisplayDataDto);

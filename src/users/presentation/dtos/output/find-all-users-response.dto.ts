import { PartialType } from '@nestjs/mapped-types';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

import { UserDto } from '../user.dto';

export class FindAllUsersResponseDataDto extends PartialType(UserDto) {
  readonly id: string;

  readonly firstname: string;

  readonly lastname: string;

  readonly name?: string;

  readonly imageUrl?: string;
}

export const FindAllUsersResponseDto = PaginationResponseDto(FindAllUsersResponseDataDto);

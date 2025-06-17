import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/interfaces/response-type';

import { UserDto } from '../user.dto';

export class FindOneUserResponseDataDto extends PartialType(UserDto) {}

export class FindMeUserResponseDataDto extends PartialType(UserDto) {}

export class FindMeUserResponseDto extends ResponseTypeDto<FindMeUserResponseDataDto> {
  @ApiProperty({ type: FindMeUserResponseDataDto })
  readonly data: FindMeUserResponseDataDto;
}

export class FindOneUserResponseDto extends ResponseTypeDto<FindOneUserResponseDataDto> {
  @ApiProperty({ type: FindOneUserResponseDataDto })
  readonly data: FindOneUserResponseDataDto;
}

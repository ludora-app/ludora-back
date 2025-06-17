import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { ResponseTypeDto } from 'src/interfaces/response-type';

import { UserDto } from '../user.dto';

export class FindOneUserResponseDataDto extends PartialType(UserDto) {
  readonly id: string;

  readonly name: string;

  readonly imageUrl?: string;

  readonly email: string;
}

export class FindMeUserResponseDataDto extends PartialType(UserDto) {
  readonly id: string;

  readonly firstname: string;

  readonly lastname: string;

  readonly imageUrl?: string;

  readonly email: string;

  readonly phone: string;

  readonly stripeAccountId?: string;
}

export class FindMeUserResponseDto extends ResponseTypeDto<FindMeUserResponseDataDto> {
  @ApiProperty({ type: FindMeUserResponseDataDto })
  readonly data: FindMeUserResponseDataDto;
}

export class FindOneUserResponseDto extends ResponseTypeDto<FindOneUserResponseDataDto> {
  @ApiProperty({ type: FindOneUserResponseDataDto })
  readonly data: FindOneUserResponseDataDto;
}

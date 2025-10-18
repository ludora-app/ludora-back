import { ApiProperty } from '@nestjs/swagger';

import { ResponseTypeDto } from '../../../interfaces/response-type';

export class VerifyEmailResponseDataDto {
  @ApiProperty({
    example: true,
    readOnly: true,
    type: Boolean,
  })
  readonly isAvailable: boolean;
}

export class VerifyEmailResponseDto extends ResponseTypeDto<VerifyEmailResponseDataDto> {
  @ApiProperty({
    type: VerifyEmailResponseDataDto,
  })
  data: VerifyEmailResponseDataDto;
}

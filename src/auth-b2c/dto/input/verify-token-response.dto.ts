import { ApiProperty } from '@nestjs/swagger';

import { ResponseTypeDto } from '../../../interfaces/response-type';

export class VerifyTokenResponseDataDto {
  @ApiProperty({
    example: true,
    readOnly: true,
    type: Boolean,
  })
  readonly isValid: boolean;
}

export class VerifyTokenResponseDto extends ResponseTypeDto<VerifyTokenResponseDataDto> {
  @ApiProperty({
    type: VerifyTokenResponseDataDto,
  })
  data: VerifyTokenResponseDataDto;
}

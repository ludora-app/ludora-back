import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { BasicLoginResponseDto } from './basic-login-response.dto';

export class RefreshTokenResponseDto extends ResponseTypeDto<BasicLoginResponseDto> {
  @ApiProperty({
    type: BasicLoginResponseDto,
  })
  data: BasicLoginResponseDto;
}

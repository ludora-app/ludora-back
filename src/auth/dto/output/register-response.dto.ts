import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/interfaces/response-type';

export class RegisterResponseDataDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    readOnly: true,
    type: String,
  })
  readonly accessToken: string;
}

export class RegisterResponseDto extends ResponseTypeDto<RegisterResponseDataDto> {
  @ApiProperty({
    type: RegisterResponseDataDto,
  })
  data: RegisterResponseDataDto;
}

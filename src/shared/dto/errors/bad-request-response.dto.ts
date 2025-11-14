import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

export class BadRequestResponseDto extends HttpErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: 'email must be an email',
  })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

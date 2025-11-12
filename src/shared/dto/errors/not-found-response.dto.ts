import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

export class NotFoundResponseDto extends HttpErrorDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Resource not found' })
  message: string;
}

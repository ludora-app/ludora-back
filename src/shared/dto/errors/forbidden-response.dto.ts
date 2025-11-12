import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

export class ForbiddenResponseDto extends HttpErrorDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'Forbidden' })
  error: string;

  @ApiProperty({ example: 'Access denied' })
  message: string;
}

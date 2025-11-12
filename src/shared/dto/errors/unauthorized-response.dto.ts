import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

export class UnauthorizedResponseDto extends HttpErrorDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;

  @ApiProperty({ example: 'Access denied' })
  message: string;
}

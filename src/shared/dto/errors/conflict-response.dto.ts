import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

export class ConflictResponseDto extends HttpErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 'Resource already exists' })
  message: string;
}

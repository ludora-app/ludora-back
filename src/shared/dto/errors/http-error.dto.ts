// src/common/dto/http-error.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export abstract class HttpErrorDto {
  @ApiProperty({
    description: 'The HTTP status code',
    example: 500,
  })
  statusCode: number;

  @ApiProperty({
    description: 'The short name of the HTTP error',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'The detailed error messages',
    oneOf: [{ example: 'An error occurred', type: 'string' }],
  })
  message: string;
}

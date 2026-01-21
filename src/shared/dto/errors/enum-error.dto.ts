import { ApiProperty } from '@nestjs/swagger';

import { HttpErrorDto } from './http-error.dto';

/**
 * Creates a generic error DTO class from an enum and its associated error messages
 * @param className - The name of the DTO class (e.g., 'JoinSessionError')
 * @param errorEnum - The enum containing error types
 * @param errorMessages - Object mapping enum values to human-readable messages
 * @param statusCode - HTTP status code (default: 400)
 * @returns A class that can be used as a Swagger response type
 */
export function createEnumErrorDto<T extends Record<string, string>>(
  className: string,
  errorEnum: T,
) {
  class GeneratedErrorDto extends HttpErrorDto {
    @ApiProperty({
      description: 'HTTP status code',
      example: 404,
    })
    statusCode: number;

    @ApiProperty({
      description: 'Exception error identifier',
    })
    error: string;

    @ApiProperty({
      description: 'Error type identifier',
      enum: Object.values(errorEnum),
      example: Object.values(errorEnum)[0],
    })
    message: string;
  }

  // Set the class name dynamically for Swagger
  Object.defineProperty(GeneratedErrorDto, 'name', { value: className });

  return GeneratedErrorDto;
}

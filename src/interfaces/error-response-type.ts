import { ApiProperty } from '@nestjs/swagger';

export interface ErrorResponseType {
  error: string;
  statusCode: number;
  message: string | Array<string>;
}

export class ErrorResponseDto {
  @ApiProperty({
    oneOf: [{ type: 'string' }, { items: { type: 'string' }, type: 'array' }],
    readOnly: true,
    required: true,
  })
  readonly message: string | Array<string>;

  @ApiProperty({ example: 'Bad Request', readOnly: true, required: true, type: String })
  readonly error: string;

  @ApiProperty({ example: 400, readOnly: true, required: true, type: Number })
  readonly statusCode: number;
}

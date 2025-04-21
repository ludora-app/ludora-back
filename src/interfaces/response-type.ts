import { ApiProperty } from '@nestjs/swagger';
export interface ResponseType<T = unknown> {
  readonly data?: T;
  readonly status?: number;
  readonly message?: string;
}

export abstract class ResponseTypeDto<T> {
  @ApiProperty({ readOnly: true, required: false })
  readonly message?: string;

  @ApiProperty({ readOnly: true, required: true })
  readonly data: T;

  @ApiProperty({ example: 200, readOnly: true, required: false })
  readonly status?: number;
}

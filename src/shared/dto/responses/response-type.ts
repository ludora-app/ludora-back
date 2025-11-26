import { ApiProperty } from '@nestjs/swagger';

export abstract class ResponseTypeDto<T> {
  @ApiProperty({ readOnly: true, required: false })
  readonly message?: string;

  @ApiProperty({ readOnly: true, required: true })
  readonly data: T;
}

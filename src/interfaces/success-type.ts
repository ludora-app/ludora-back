import { ApiProperty } from '@nestjs/swagger';

export abstract class SuccessTypeDto {
  @ApiProperty({ required: false })
  readonly message?: string;

  @ApiProperty({ example: 200, required: false })
  readonly status?: number;
}

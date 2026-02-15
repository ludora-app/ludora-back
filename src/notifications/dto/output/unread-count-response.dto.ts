import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class UnreadCountResponse extends ResponseTypeDto<number> {
  @ApiProperty({ example: 1 })
  readonly data: number;

  @ApiProperty({ example: 'Unread count fetched successfully' })
  readonly message: string;
}

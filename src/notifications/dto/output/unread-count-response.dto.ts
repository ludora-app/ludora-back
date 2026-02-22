import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class UnreadCountResponseData {
  @ApiProperty({
    description: 'The number of unread notifications',
    example: 5,
  })
  unreadCount: number;
}

export class UnreadCountResponseDto extends ResponseTypeDto<UnreadCountResponseData> {
  @ApiProperty({ type: UnreadCountResponseData })
  readonly data: UnreadCountResponseData;
}

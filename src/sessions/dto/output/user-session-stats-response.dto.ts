import { ApiProperty } from '@nestjs/swagger';

export class UserSessionStatsResponseDataDto {
  @ApiProperty({ example: 12 })
  organizedCount: number;

  @ApiProperty({ example: 25 })
  participatedCount: number;
}

export class UserSessionStatsResponseDto {
  @ApiProperty()
  data: UserSessionStatsResponseDataDto;

  @ApiProperty()
  message: string;
}

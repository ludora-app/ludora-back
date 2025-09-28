import { ApiProperty } from '@nestjs/swagger';
import { Team_label } from '@prisma/client';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

export class SessionTeamResponse {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly id: string;

  @ApiProperty({ example: 'Team A', readOnly: true })
  readonly teamName: string;

  @ApiProperty({ example: Team_label.A, readOnly: true })
  readonly teamLabel: Team_label;

  @ApiProperty({
    description: 'Session update date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Session creation date',
    example: '2025-05-10T22:30:32.525Z',
    readOnly: true,
  })
  createdAt: Date;
}

export const PaginatedSessionTeamResponse = PaginationResponseDto(SessionTeamResponse);

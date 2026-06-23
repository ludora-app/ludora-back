import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { ReportReason } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { FindAllReportedUsersResponseData } from './find-all-reported-users-response.dto';
import { UserSimpleDisplayWithUidData } from './user-simple-display-data.dto';

export class Reports {
  @ApiProperty({
    description: 'Reason for the report',
    enum: ReportReason,
  })
  reason: ReportReason;

  @ApiProperty({
    description: 'Description of the report',
    example: 'The user was spamming the chat',
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Date of the report',
    example: '2022-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User who made the report',
    type: UserSimpleDisplayWithUidData,
  })
  reporter: UserSimpleDisplayWithUidData;
}

export class FindOneUserWithReportsResponseData extends OmitType(FindAllReportedUsersResponseData, [
  'reportCount',
]) {
  @IsInt()
  @ApiProperty({
    description: 'Number of matches the user has',
    example: 10,
  })
  matchesCount: number;

  @ApiProperty({
    description: 'List of reports made against the user',
    type: [Reports],
  })
  @ValidateNested({ each: true })
  @Type(() => Reports)
  @IsArray()
  reports: Reports[];
}

export class FindOneUserWithReportsResponseDto extends ResponseTypeDto<FindOneUserWithReportsResponseData> {
  @ApiProperty({ type: FindOneUserWithReportsResponseData })
  readonly data: FindOneUserWithReportsResponseData;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ReportReason } from 'generated/prisma/enums';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

export class ReportFilterDto extends BaseFilterDto {
  @ApiProperty({
    description: 'Filter by report reason',
    enum: ReportReason,
    example: ReportReason.SPAM,
    required: false,
  })
  @IsEnum(ReportReason)
  @IsOptional()
  reportReason?: ReportReason;
}

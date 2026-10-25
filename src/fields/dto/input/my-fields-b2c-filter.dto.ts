import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';
import { BaseFilterDto } from 'src/shared/dto/input/base-filter.dto';

export class MyFieldsB2CFilterDto extends BaseFilterDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  @ApiProperty({
    description: 'Filter by verification status (PENDING, APPROVED, REJECTED)',
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
    required: false,
  })
  status?: VerificationStatus;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';

export class MyFieldsB2CFilterDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  @ApiProperty({
    description: 'Filter by verification status (PENDING, APPROVED, REJECTED)',
    enum: VerificationStatus,
    example: VerificationStatus.PENDING,
    required: false,
  })
  status?: VerificationStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Cursor for pagination',
    example: 'abc123',
    required: false,
  })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiProperty({
    description: 'Number of results to return',
    example: 10,
    required: false,
  })
  limit?: number;
}

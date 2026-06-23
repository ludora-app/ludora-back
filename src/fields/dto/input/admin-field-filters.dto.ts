import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';
import { FieldFilterDto } from './field-filter.dto';

export class AdminFieldFiltersDto extends OmitType(FieldFilterDto, [
  'type',
  'duration',
  'userLat',
  'userLon',
  'timezone',
  'date',
  'gameModes',
]) {
  @ApiProperty({
    enum: VerificationStatus,
    required: false,
  })
  @IsEnum(VerificationStatus)
  @IsOptional()
  status?: VerificationStatus;
}

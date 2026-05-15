import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from 'generated/prisma/enums';
import { CreateImageDto } from 'src/auth/dto';
import { Sport } from 'src/shared/constants/constants';

export class UpdateFieldImageDto extends CreateImageDto {
  @ApiProperty({ description: 'The uid of the image if it is already saved', readOnly: true })
  @IsString()
  @IsOptional()
  readonly uid?: string;

  @ApiProperty({ enum: VerificationStatus, readOnly: true })
  @IsEnum(VerificationStatus)
  @IsOptional()
  readonly status?: VerificationStatus;
}

export class UpdateFieldAdminDto {
  @ApiProperty({ example: 'Field 1', readOnly: true })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', readOnly: true })
  @IsString()
  @IsOptional()
  readonly address?: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @ApiProperty({
    description: 'The images of the field',
    type: [UpdateFieldImageDto],
  })
  readonly images?: UpdateFieldImageDto[];

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'The sports available on the field',
    example: [Sport.FOOTBALL, Sport.TENNIS, Sport.BASKETBALL],
    enum: Sport,
    isArray: true,
    type: 'array',
  })
  readonly sports?: Sport[];

  @ApiProperty({ enum: VerificationStatus, readOnly: true })
  @IsEnum(VerificationStatus)
  readonly status: VerificationStatus;
}

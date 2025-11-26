import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFieldDto {
  @ApiProperty({ example: 'Field 1', readOnly: true })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', readOnly: true })
  @IsString()
  @IsOptional()
  readonly address?: string;

  @ApiProperty({ example: true, readOnly: true })
  @IsBoolean()
  @IsOptional()
  readonly isVerified?: boolean;
}

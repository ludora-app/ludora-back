import { ApiProperty } from '@nestjs/swagger';
import { CreateImageDto } from 'src/auth/dto';
import { ArrayMaxSize, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFieldDto {
  @ApiProperty({ example: 'Field 1', readOnly: true })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', readOnly: true })
  @IsString()
  @IsOptional()
  readonly address?: string;

  @ApiProperty({ example: '123 Main St', readOnly: true })
  @IsString()
  @IsOptional()
  readonly shortAddress?: string;

  @ApiProperty({ example: 40.7128, readOnly: true })
  @IsNumber()
  @IsOptional()
  readonly lat?: number;

  @ApiProperty({ example: -74.006, readOnly: true })
  @IsNumber()
  @IsOptional()
  readonly lng?: number;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @ApiProperty({
    description: 'The images of the field',
    type: [CreateImageDto],
  })
  readonly files?: CreateImageDto[];
}

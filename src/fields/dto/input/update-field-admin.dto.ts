import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString } from 'class-validator';
import { CreateImageDto } from 'src/auth/dto';

export class UpdateFieldAdminDto {
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

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @ApiProperty({
    description: 'The images of the field',
    type: [CreateImageDto],
  })
  readonly files?: CreateImageDto[];
}

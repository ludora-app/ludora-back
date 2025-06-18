import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';

import { CreateImageDto } from './create-image.dto';

export class UpdateImageDto extends PartialType(CreateImageDto) {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "nom de l'image",
    example: '10121551_image.jpg',
    type: String,
  })
  readonly name?: string;
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: "Ordre d'affichage de l'image",
    example: 1,
    required: false,
    type: Number,
  })
  order?: number;
}

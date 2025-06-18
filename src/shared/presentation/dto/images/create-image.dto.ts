import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateImageDto {
  @IsString()
  @ApiProperty({
    description: "nom de l'image",
    example: '10121551_image.jpg',
    type: String,
  })
  readonly name: string;
  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: "Ordre d'affichage de l'image",
    example: 1,
    type: Number,
  })
  order?: number;

  @ApiProperty({
    description: "Fichier de l'image",
    format: 'binary',
    type: 'string',
  })
  file: Buffer;
}

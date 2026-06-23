import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateImageDto {
  @IsString()
  @ApiProperty({
    description: 'image name',
    example: '10121551_image.jpg',
    type: String,
  })
  readonly name: string;

  @IsOptional()
  @ApiProperty({
    description: 'Display order of the image',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Max(4)
  order?: number;

  @ApiProperty({
    description: 'image file',
    format: 'binary',
    type: 'string',
  })
  file: Buffer;
}

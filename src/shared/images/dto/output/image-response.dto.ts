import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ description: 'Order of the image', example: 1, readOnly: true })
  readonly order?: number | null;

  @ApiProperty({
    description: 'URL of the image',
    example: 'https://example.com/image.jpg',
    readOnly: true,
  })
  readonly url: string;
}

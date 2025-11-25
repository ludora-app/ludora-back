import { ApiProperty } from '@nestjs/swagger';

export class FieldWithImagesDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  readonly uid: string;

  @ApiProperty({ example: 'Field 1', readOnly: true })
  readonly name: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', readOnly: true })
  readonly address: string;

  @ApiProperty({ example: 48.8588443, readOnly: true })
  readonly latitude: number;

  @ApiProperty({ example: 2.2943506, readOnly: true })
  readonly longitude: number;

  @ApiProperty({ example: [{ url: 'https://example.com/image.jpg' }], readOnly: true })
  readonly fieldImages: { url: string }[];
}

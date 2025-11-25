import { ApiProperty } from '@nestjs/swagger';
import { CreateImageDto } from 'src/auth-b2c/dto';
import { Sport } from 'src/shared/constants/constants';
import { ArrayMaxSize, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreatePublicFieldDto {
  @IsEnum(Sport)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The sport of the field',
    enum: Sport,
    example: Sport.BASKETBALL,
  })
  sport: Sport;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The address of the field',
    example: '123 Main St, Anytown, USA',
  })
  address: string;

  @IsArray()
  @IsNotEmpty()
  @ArrayMaxSize(5)
  @ApiProperty({
    description: 'The images of the field',
    type: [CreateImageDto],
  })
  images: CreateImageDto[];
}

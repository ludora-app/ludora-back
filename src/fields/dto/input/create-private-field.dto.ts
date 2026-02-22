import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CreateImageDto } from 'src/auth/dto';
import { Sport } from 'src/shared/constants/constants';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePrivateFieldDto {
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value ? [value] : value;
  })
  @IsEnum(Sport, { each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'The sport of the field',
    enum: Sport,
    example: [Sport.BASKETBALL, Sport.FOOTBALL],
    isArray: true,
  })
  sports: Sport[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the field',
    example: 'My Basketball Court',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The address of the field',
    example: '123 Main St, Anytown, USA',
  })
  address: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The latitude of the field',
    example: 40.7128,
  })
  lat?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'The longitude of the field',
    example: -74.006,
  })
  lng?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The short address of the field',
    example: '123 Main St, Anytown, USA',
  })
  shortAddress?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The uid of the partner',
    example: 'cmjzyy8j300084jt3dc8pswsu',
  })
  partnerUid: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @ApiProperty({
    description: 'The images of the field',
    type: [CreateImageDto],
  })
  images?: CreateImageDto[];
}

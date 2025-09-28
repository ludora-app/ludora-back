import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Sex } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsPhoneNumber, IsString, IsUrl } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The firstname of the user',
    example: 'John',
    required: false,
    type: String,
  })
  firstname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The lastname of the user',
    example: 'Doe',
    required: false,
    type: String,
  })
  lastname?: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'The birthdate of the user',
    example: '01/01/2000',
    required: false,
    type: String,
  })
  birthdate?: string;

  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: 'The sex of the user',
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  sex?: Sex;

  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+33612345678',
    required: false,
    type: String,
  })
  phone?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: 'The image url of the user',
    example: 'https://www.example.com/image.jpg',
    required: false,
    type: String,
  })
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The biography of the user',
    example: 'Je suis un bousilleur',
    required: false,
    type: String,
  })
  bio?: string;
}

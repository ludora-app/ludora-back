import { Sex } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsPhoneNumber, IsUrl, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'John',
    required: false,
    type: String,
  })
  firstname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Doe',
    required: false,
    type: String,
  })
  lastname?: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: "Date de naissance de l'utilisateur",
    example: '01/01/2000',
    required: false,
    type: String,
  })
  birthdate?: string;

  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: "Sexe de l'utilisateur",
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  sex?: Sex;

  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: "Numéro de téléphone de l'utilisateur",
    example: '+33612345678',
    required: false,
    type: String,
  })
  phone?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: "URL de l'image de profil",
    example: 'https://www.example.com/image.jpg',
    required: false,
    type: String,
  })
  image_url?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "Biographie de l'utilisateur",
    example: 'Je suis un bousilleur',
    required: false,
    type: String,
  })
  bio?: string;
}

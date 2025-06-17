import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Sex } from 'src/users/domain/value-objects/sex';
import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsEmail,
  IsAlpha,
  IsDateString,
  IsStrongPassword,
} from 'class-validator';

import { UserDto } from '../user.dto';

export class CreateUserDto extends PartialType(UserDto) {
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur",
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @ApiProperty({ description: 'password', example: 'Test!1234' })
  readonly password: string;

  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'John',
    readOnly: true,
    type: String,
  })
  readonly firstname: string;

  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: "Nom de l'utilisateur",
    example: 'Doe',
    readOnly: true,
    type: String,
  })
  readonly lastname: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: "Date de naissance de l'utilisateur",
    example: '01/01/2000',
    oneOf: [{ type: 'string' }, { type: 'Date' }],
    readOnly: true,
  })
  readonly birthdate?: string;

  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: "Sexe de l'utilisateur",
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    readOnly: true,
    required: false,
  })
  readonly sex?: Sex;

  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: "Numéro de téléphone de l'utilisateur",
    example: '+33612345678',
    readOnly: true,
    required: false,
    type: String,
  })
  readonly phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: "Biographie de l'utilisateur",
    example: 'Je suis un bousilleur',
    readOnly: true,
    required: false,
    type: String,
  })
  readonly bio?: string;
}

import { Sex } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/users/password.validator';
import {
  IsString,
  IsNotEmpty,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsEmail,
  Validate,
  MinLength,
  IsAlpha,
  IsDateString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur",
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @Validate(IsStrongPassword)
  @MinLength(8)
  @ApiProperty({
    description: "Le mot de passe de l'utilisateur",
    example: 'Test!1234',
    readOnly: true,
    type: String,
  })
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
  readonly birthdate?: string | Date;

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

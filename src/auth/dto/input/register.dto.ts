import { ApiProperty } from '@nestjs/swagger';
import { Sex, User_type } from '@prisma/client';
import {
  IsEnum,
  IsString,
  IsOptional,
  ValidateIf,
  IsDateString,
  IsEmail,
  IsPhoneNumber,
  IsStrongPassword,
} from 'class-validator';

export class RegisterUserDto {
  @IsEnum(User_type)
  @ApiProperty({
    description: 'user type (USER or ADMIN)',
    enum: User_type,
    example: User_type.USER,
  })
  readonly type: User_type;

  // Propriétés communes
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'device id, only for phones',
    example: '123456',
  })
  readonly deviceId?: string;

  @IsString()
  @IsEmail()
  @ApiProperty({ description: 'email', example: 'test@mail.com' })
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

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'firstname of user',
    example: 'Doe',
  })
  readonly firstname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'lastname of user',
    example: 'Doe',
  })
  readonly lastname?: string;

  @IsOptional()
  @IsPhoneNumber('FR')
  @ApiProperty({ description: 'phone number', example: '+33612345678' })
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Bio',
    example: "Je suis un utilisateur de l'application.",
  })
  readonly bio?: string;

  // Champs spécifiques à USER
  @ValidateIf((dto) => dto.type === User_type.USER)
  @IsDateString()
  @ApiProperty({
    description: 'birthdate of user',
    example: '1990-01-01',
    format: 'date',
    type: 'string',
  })
  readonly birthdate?: string;

  @ValidateIf((dto) => dto.type === User_type.USER)
  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: 'sex of user',
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  readonly sex?: Sex;
}

export class RegisterUserWithFileDto extends RegisterUserDto {
  @ApiProperty({
    description: 'Fichier image (avatar)',
    format: 'binary',
    required: false,
    type: 'string',
  })
  file?: any;
}

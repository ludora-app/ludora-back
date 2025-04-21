import { ApiProperty } from '@nestjs/swagger';
import { Sex, User_type } from '@prisma/client';
import { IsStrongPassword } from 'src/users/password.validator';
import {
  IsEnum,
  IsString,
  IsOptional,
  ValidateIf,
  IsDateString,
  IsEmail,
  MinLength,
  IsPhoneNumber,
  Validate,
} from 'class-validator';

export class RegisterUserDto {
  @IsEnum(User_type)
  @ApiProperty({
    description: 'user type (USER or ORGANISATION)',
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
  readonly device_id?: string;

  @IsString()
  @IsEmail()
  @ApiProperty({ description: 'email', example: 'test@mail.com' })
  readonly email: string;

  @Validate(IsStrongPassword)
  @IsString()
  @MinLength(8)
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
  @IsString()
  @ApiProperty({
    description: 'name of organisation (required if ORGANISATION)',
    example: 'Nysa',
  })
  readonly name?: string;

  @IsOptional()
  @IsPhoneNumber('FR')
  @ApiProperty({ description: 'phone number', example: '+33612345678' })
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Bio',
    example: 'Je suis un utilisateur ou une organisation.',
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

  // Champs spécifiques à ORGANISATION
  @ValidateIf((dto) => dto.type === User_type.ORGANISATION)
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'city of organisation (ORGANISATION only)',
    example: 'Paris',
    required: false,
  })
  readonly city?: string;
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

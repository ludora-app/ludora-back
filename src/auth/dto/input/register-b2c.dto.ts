import { ApiProperty } from '@nestjs/swagger';
import { Sex, UserType } from 'generated/prisma/client';
import { IsStrongPassword } from 'src/users/validators/password.validator';
import {
  IsAlpha,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';

export class RegisterB2CDto {
  @IsEnum(UserType)
  @ApiProperty({
    description: 'type of the user',
    enum: UserType,
    example: UserType.USER,
  })
  readonly type: UserType;

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
    description: 'firstname of the user',
    example: 'Doe',
  })
  readonly firstname?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'lastname of the user',
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
    example: "I'm a user of the application.",
  })
  readonly bio?: string;

  // Champs spécifiques à USER
  @ValidateIf((dto) => dto.type === UserType.USER)
  @IsDateString()
  @ApiProperty({
    description: 'birthdate of the user',
    example: '1990-01-01',
    format: 'date',
    type: 'string',
  })
  readonly birthdate?: string;

  @ValidateIf((dto) => dto.type === UserType.USER)
  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: 'sex of the user',
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  readonly sex?: Sex;

  @IsString()
  @IsAlpha('fr-FR')
  @MaxLength(50)
  @MinLength(2)
  @IsOptional()
  @ApiProperty({
    description: 'city of the user',
    example: 'Paris',
    required: false,
  })
  readonly city?: string;
}

export class RegisterB2CWithFileDto extends RegisterB2CDto {
  @ApiProperty({
    description: 'File image (avatar)',
    format: 'binary',
    required: false,
    type: 'string',
  })
  file?: any;
}

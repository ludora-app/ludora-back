import { ApiProperty } from '@nestjs/swagger';
import { Sex, User_type } from '@prisma/client';
import { IsStrongPassword } from 'src/users/password.validator';
import {
  IsAlpha,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @Validate(IsStrongPassword)
  @MinLength(8)
  @ApiProperty({
    description: 'The password of the user',
    example: 'Test!1234',
    readOnly: true,
    type: String,
  })
  readonly password: string;

  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: 'The firstname of the user',
    example: 'John',
    readOnly: true,
    type: String,
  })
  readonly firstname: string;

  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: 'The lastname of the user',
    example: 'Doe',
    readOnly: true,
    type: String,
  })
  readonly lastname: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'The birthdate of the user',
    example: '01/01/2000',
    oneOf: [{ type: 'string' }, { type: 'Date' }],
    readOnly: true,
  })
  readonly birthdate?: string | Date;

  @IsEnum(Sex, { message: 'Unknown Sex' })
  @IsOptional()
  @ApiProperty({
    description: 'The sex of the user',
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    readOnly: true,
    required: false,
  })
  readonly sex?: Sex;

  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+33612345678',
    readOnly: true,
    required: false,
    type: String,
  })
  readonly phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The biography of the user',
    example: 'I am a bousilleur',
    readOnly: true,
    required: false,
    type: String,
  })
  readonly bio?: string;

  @IsEnum(User_type)
  @IsOptional()
  @ApiProperty({
    description: 'The role of the user',
    enum: User_type,
    example: User_type.PARTNER,
    readOnly: true,
    required: false,
  })
  readonly type?: User_type;
}

import { ApiProperty } from '@nestjs/swagger';
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
  ValidateIf,
} from 'class-validator';
import { Provider, Sex, UserType } from 'generated/prisma/client';
import { IsStrongPassword } from 'src/users/validators/password.validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @ValidateIf((o) => o.provider === Provider.LUDORA)
  @Validate(IsStrongPassword)
  @MinLength(8)
  @ApiProperty({
    description: 'The password of the user',
    example: 'Test!1234',
    readOnly: true,
    type: String,
  })
  readonly password?: string;

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
  @ValidateIf((o) => o.provider === Provider.LUDORA)
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

  @IsEnum(UserType)
  @IsOptional()
  @ApiProperty({
    description: 'The role of the user',
    enum: UserType,
    example: UserType.PARTNER,
    readOnly: true,
    required: false,
  })
  readonly type?: UserType;

  @IsEnum(Provider)
  @IsOptional()
  @ApiProperty({
    description: 'The provider of the user',
    enum: Provider,
    example: Provider.GOOGLE,
    type: String,
  })
  provider?: Provider;

  @IsString()
  @ValidateIf((o) => o.provider === Provider.APPLE)
  @ApiProperty({
    description: 'The apple id, this field is called "user" in the apple response',
    example: 'user',
    type: String,
  })
  readonly appleId?: string;

  @IsString()
  @ValidateIf((o) => o.provider === Provider.APPLE)
  @ApiProperty({
    description:
      'The encrypted apple refresh token, this field is called "refresh_token" in the apple response',
    example: 'refresh_token',
    type: String,
  })
  readonly appleRefreshToken?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Sex } from 'src/users/domain/value-objects/sex';
import { Provider } from 'src/users/domain/value-objects/provider';
import { UserType } from 'src/users/domain/value-objects/user-type';
import {
  IsAlpha,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class UserDto {
  @ApiProperty({ example: 'cm7hvgonx0000to0mh5maqajc', readOnly: true })
  @IsUUID()
  readonly id: string;

  @ApiProperty({ example: 'Toto', readOnly: true })
  @IsAlpha('fr-FR')
  readonly firstname: string;

  @ApiProperty({ example: 'Lolo', readOnly: true })
  @IsAlpha('fr-FR')
  readonly lastname: string;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  @IsAlpha('fr-FR')
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ example: 'I am a good person', nullable: true, readOnly: true })
  @IsString()
  @IsOptional()
  readonly bio?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true, readOnly: true })
  @IsUrl()
  @IsOptional()
  readonly imageUrl?: string;

  @ApiProperty({ example: 'toto@gmail.com', nullable: true, readOnly: true })
  @IsEmail()
  readonly email?: string;

  @ApiProperty({
    description: "Numéro de téléphone de l'utilisateur",
    example: '+33612345678',
    readOnly: true,
    required: false,
    type: String,
  })
  @IsPhoneNumber('FR')
  @IsOptional()
  readonly phone?: string;

  @ApiProperty({ example: '1998-01-31T00:00:00.000Z', nullable: true, readOnly: true })
  @IsDateString()
  @IsOptional()
  readonly birthdate?: string;

  @ApiProperty({
    description: "Sexe de l'utilisateur",
    enum: Sex,
    example: ['MALE', 'FEMALE', 'OTHER'],
    readOnly: true,
    required: false,
  })
  @IsEnum(Sex)
  @IsOptional()
  readonly sex?: Sex;

  @ApiProperty({ example: true, nullable: true, readOnly: true })
  @IsBoolean()
  readonly active?: boolean;

  @ApiProperty({ enum: UserType, example: 'USER', nullable: true, readOnly: true })
  @IsEnum(UserType)
  readonly type: UserType;

  @ApiProperty({ example: null, nullable: true, readOnly: true })
  @IsString()
  @IsOptional()
  readonly stripeAccountId?: string;

  @ApiProperty({ enum: Provider, example: 'GOOGLE', nullable: true, readOnly: true })
  @IsEnum(Provider)
  readonly provider: Provider;

  @ApiProperty({ example: 'Password123!', readOnly: true })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  readonly password: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', readOnly: true })
  @IsDateString()
  readonly createdAt: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', readOnly: true })
  @IsDateString()
  readonly updatedAt: string;

  @ApiProperty({ example: true, readOnly: true })
  @IsBoolean()
  readonly emailVerified: boolean;

  @ApiProperty({ example: true, readOnly: true })
  @IsBoolean()
  readonly isConnected: boolean;
}

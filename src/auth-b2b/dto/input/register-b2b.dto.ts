import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlpha,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
  Validate,
} from 'class-validator';

/**
 * @description DTO used to register a Partner Organization and its ADMIN USER
 */
export class RegisterB2BDto {
  // user
  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: 'The firstname of the user',
    example: 'John',
    readOnly: true,
    type: String,
  })
  userFirstname: string;
  @IsAlpha('fr-FR')
  @IsNotEmpty()
  @ApiProperty({
    description: 'The lastname of the user',
    example: 'Doe',
    readOnly: true,
    type: String,
  })
  userLastname: string;
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  userEmail: string;
  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+33612345678',
    readOnly: true,
    required: false,
    type: String,
  })
  userPhone?: string;

  @Validate(IsStrongPassword)
  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'The password of the user',
    example: 'Test!1234',
    readOnly: true,
    type: String,
  })
  userPassword: string;

  //   partner
  @IsString()
  @ApiProperty({
    description: 'The name of the organasation who owns the fields',
    example: 'Partner Name',
    type: String,
  })
  partnerName: string;
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The url of the partner logo',
    example: 'https://www.example.com/image.jpg',
    type: String,
  })
  partnerImageUrl?: string;
  @IsString()
  @ApiProperty({
    description: 'The address of the partner',
    example: '123 Main St, Anytown, USA',
    type: String,
  })
  partnerAddress: string;
  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the partner',
    example: '+1234567890',
    type: String,
  })
  partnerPhone?: string;
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'The email of the partner',
    example: 'partner@example.com',
    type: String,
  })
  partnerEmail?: string;
}

import {
  IsEmail,
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
  @IsString()
  userFirstname: string;
  @IsString()
  userLastname: string;
  @IsEmail()
  userEmail: string;
  @IsPhoneNumber('FR')
  @IsOptional()
  userPhone?: string;
  @IsString()
  userAddress: string;
  @Validate(IsStrongPassword)
  @IsString()
  @MinLength(8)
  userPassword: string;

  //   partner
  @IsString()
  partnerName: string;
  @IsString()
  @IsOptional()
  partnerImageUrl?: string;
  @IsString()
  partnerAddress: string;
  @IsPhoneNumber('FR')
  @IsOptional()
  partnerPhone?: string;
  @IsEmail()
  @IsOptional()
  partnerEmail?: string;
}

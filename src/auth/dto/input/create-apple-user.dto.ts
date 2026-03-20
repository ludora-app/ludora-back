import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AppleAuthenticationFullName {
  @IsOptional()
  @ApiProperty({
    description: 'The family name of the user',
    example: 'Doe',
    type: String,
  })
  readonly familyName?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The given name of the user',
    example: 'John',
    type: String,
  })
  readonly givenName?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The middle name of the user',
    example: 'Doe',
    type: String,
  })
  readonly middleName?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The name prefix of the user',
    example: 'Doe',
    type: String,
  })
  readonly namePrefix?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The name suffix of the user',
    example: 'Doe',
    type: String,
  })
  readonly nameSuffix?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The nickname of the user',
    example: 'Doe',
    type: String,
  })
  readonly nickname?: string | null;
}

export class CreateAppleUserDto {
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    type: AppleAuthenticationFullName,
  })
  readonly fullName?: AppleAuthenticationFullName | null;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The identity token of the user',
    example: 'token',
    type: String,
  })
  readonly identityToken?: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The authorization code of the user',
    example: 'code',
    type: String,
  })
  readonly authorizationCode?: string | null;

  @IsOptional()
  @ApiProperty({
    description: 'The real user status of the user',
    example: 'user',
    type: String,
  })
  readonly realUserStatus?: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The state of the user',
    example: 'state',
    type: String,
  })
  readonly state?: string | null;

  @IsString()
  @ApiProperty({
    description: 'The apple id of the user',
    example: 'user',
    type: String,
  })
  readonly user: string;
}

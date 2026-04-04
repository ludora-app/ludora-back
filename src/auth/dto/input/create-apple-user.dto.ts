import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AppleAuthenticationFullName {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The family name of the user',
    example: 'Doe',
    type: String,
  })
  readonly familyName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The given name of the user',
    example: 'John',
    type: String,
  })
  readonly givenName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The middle name of the user',
    example: 'Doe',
    type: String,
  })
  readonly middleName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The name prefix of the user',
    example: 'Doe',
    type: String,
  })
  readonly namePrefix?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The name suffix of the user',
    example: 'Doe',
    type: String,
  })
  readonly nameSuffix?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The nickname of the user',
    example: 'Doe',
    type: String,
  })
  readonly nickname?: string | null;
}

export enum RealUserStatus {
  UNSUPPORTED = 0,
  UNKNOWN = 1,
  LIKELY_REAL = 2,
}

export class CreateAppleUserDto {
  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The full name of the user',
    example: 'John Doe',
    type: AppleAuthenticationFullName,
  })
  readonly fullName?: AppleAuthenticationFullName | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The identity token of the user',
    example: 'token',
    type: String,
  })
  readonly identityToken?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The authorization code of the user',
    example: 'code',
    type: String,
  })
  readonly authorizationCode?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The real user status of the user',
    example: RealUserStatus.LIKELY_REAL,
    enum: RealUserStatus,
  })
  readonly realUserStatus?: RealUserStatus | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
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

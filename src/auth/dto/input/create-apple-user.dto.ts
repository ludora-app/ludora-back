import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AppleAuthenticationFullName {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The family name of the user',
    example: 'Doe',
    type: String,
    nullable: true,
  })
  readonly familyName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The given name of the user',
    example: 'John',
    type: String,
    nullable: true,
  })
  readonly givenName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The middle name of the user',
    example: 'Doe',
    type: String,
    nullable: true,
  })
  readonly middleName?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The name prefix of the user',
    example: 'Doe',
    type: String,
    nullable: true,
  })
  readonly namePrefix?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The name suffix of the user',
    example: 'Doe',
    type: String,
    nullable: true,
  })
  readonly nameSuffix?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The nickname of the user',
    example: 'Doe',
    type: String,
    nullable: true,
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
    nullable: true,
  })
  readonly email?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The full name of the user',
    example: 'John Doe',
    type: AppleAuthenticationFullName,
    nullable: true,
  })
  readonly fullName?: AppleAuthenticationFullName | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The identity token of the user',
    example: 'token',
    type: String || null,
    nullable: true,
  })
  readonly identityToken?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The authorization code of the user',
    example: 'code',
    type: String,
    nullable: true,
  })
  readonly authorizationCode?: string | null;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The real user status of the user',
    example: RealUserStatus.LIKELY_REAL,
    enum: RealUserStatus,
    nullable: true,
  })
  readonly realUserStatus?: RealUserStatus | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The state of the user',
    example: 'state',
    type: String,
    nullable: true,
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

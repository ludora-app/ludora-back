import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @ApiProperty({ description: 'password', example: 'Test!1234' })
  readonly password: string;

  @IsOptional()
  @ApiProperty({
    description: 'Device identifier, only for phones',
    example: '123456',
    type: String,
  })
  readonly deviceId?: string;
}

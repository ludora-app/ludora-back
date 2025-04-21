import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/users/password.validator';
import { IsEmail, IsOptional, MinLength, Validate } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @Validate(IsStrongPassword)
  @MinLength(8)
  @ApiProperty({
    description: `User Password.
      Must contain at least:
        - 8 characters
        - 1 uppercase letter
        - 1 special character`,
    example: 'Test!1234',
    minLength: 8,
    pattern: '^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$',
    type: String,
  })
  readonly password: string;

  @IsOptional()
  @ApiProperty({
    description: 'Device identifier, only for phones',
    example: '123456',
    type: String,
  })
  readonly device_id?: string;
}

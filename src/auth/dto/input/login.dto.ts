import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength, Validate } from 'class-validator';
import { IsStrongPassword } from 'src/users/validators/password.validator';

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
}

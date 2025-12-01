import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Validate } from 'class-validator';
import { IsStrongPassword } from 'src/users/password.validator';

export class ForgottenPasswordDto {
  @IsString()
  @Validate(IsStrongPassword)
  @ApiProperty({
    description: 'New password of the user',
    example: 'password',
    required: true,
    type: String,
  })
  newPassword: string;

  @IsString()
  @Length(6, 6)
  @ApiProperty({
    description: 'Verification code of the user',
    example: '123456',
    required: true,
    type: String,
  })
  verificationCode: string;
}

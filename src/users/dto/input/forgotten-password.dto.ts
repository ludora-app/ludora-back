import { ApiProperty } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
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
}

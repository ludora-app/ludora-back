import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetRequestDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;
}

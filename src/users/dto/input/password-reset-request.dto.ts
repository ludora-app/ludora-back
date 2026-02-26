import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class PasswordResetRequestDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;
}

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMailDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;
}

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMailDto {
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur",
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;
}

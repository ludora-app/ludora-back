import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class GenerateAccessTokenFromCodeDto {
  @IsString()
  @Length(6, 6)
  @ApiProperty({
    description: 'Code to generate the access token from in the password reset workflow',
    example: '123456',
    type: String,
  })
  code: string;

  @IsEmail()
  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;
}

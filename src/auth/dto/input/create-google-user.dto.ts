import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
    type: String,
  })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The firstname of the user',
    example: 'John',
    type: String,
  })
  readonly firstname: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The lastname of the user',
    example: 'Doe',
    type: String,
  })
  readonly lastname?: string;

  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The image url of the user',
    example: 'https://www.example.com/image.jpg',
    type: String,
  })
  readonly imageUrl?: string;
}

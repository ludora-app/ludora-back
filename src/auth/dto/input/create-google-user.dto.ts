import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { Provider } from 'generated/prisma/enums';

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
  @ApiProperty({
    description: 'The lastname of the user',
    example: 'Doe',
    type: String,
  })
  readonly lastname?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: 'The image url of the user',
    example: 'https://www.example.com/image.jpg',
    type: String,
  })
  readonly imageUrl?: string;

  @IsEnum(Provider)
  @IsOptional()
  @ApiProperty({
    description: 'The provider of the user',
    enum: Provider,
    example: Provider.GOOGLE,
    type: String,
  })
  provider?: Provider;
}

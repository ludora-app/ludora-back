import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @ApiProperty({
    description: 'The name of the organasation who owns the fields',
    example: 'Partner Name',
  })
  name: string;
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The url of the partner logo',
    example: 'https://www.example.com/image.jpg',
  })
  imageUrl?: string;
  @IsString()
  @ApiProperty({
    description: 'The address of the partner',
    example: '123 Main St, Anytown, USA',
  })
  address: string;
  @IsPhoneNumber('FR')
  @IsOptional()
  @ApiProperty({
    description: 'The phone number of the partner',
    example: '+1234567890',
  })
  phone?: string;
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'The email of the partner',
    example: 'partner@example.com',
  })
  email?: string;
}

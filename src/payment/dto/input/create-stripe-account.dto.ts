import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateStripeAccountDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Firstname of the account holder',
    example: 'John',
    type: String,
  })
  firstname: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Lastname of the account holder',
    example: 'Doe',
    type: String,
  })
  lastname: string;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({
    description: 'Address of the account holder',
    example: {
      city: 'Paris',
      country: 'France',
      countryCode: 'FR',
      line1: '123 Main St',
      line2: 'Apt 1',
      postalCode: '94000',
    },
  })
  address: {
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    country: string;
    countryCode: string;
  };

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Currency of the account',
    example: 'eur',
  })
  currency: string;
}

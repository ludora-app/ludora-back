import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, Equals } from 'class-validator';

export class BankDetailsDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Name of the account holder',
    example: 'John Doe',
  })
  holderName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
  })
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Routing number (BIC)',
    example: '1234567890',
  })
  routingNumber: string;
}

export class UpdateBankDetailsDto {
  @IsNotEmpty()
  @Equals(true, { message: 'only true is accepted' })
  @IsBoolean()
  @ApiProperty({
    description: 'Default Stripe connect account',
    example: true,
  })
  defaultForCurrency: true;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PaymentIntentDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Amount of the payment',
    example: 100,
  })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Currency of the payment',
    example: 'eur',
  })
  currency: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Connected account ID',
    example: 'acct_1234567890',
  })
  connectedAccountId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Payment method ID',
    example: 'pm_1234567890',
  })
  paymentMethodId: string;
}

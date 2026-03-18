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
    description: 'UID of the session being booked',
    example: 'cuid12345',
  })
  sessionUid: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'UID of the user making the payment',
    example: 'cuid67890',
  })
  userUid: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Payment method ID',
    example: 'pm_1234567890',
  })
  paymentMethodId: string;
}

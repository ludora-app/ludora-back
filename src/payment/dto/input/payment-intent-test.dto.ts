import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PaymentIntentTestDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'Amount of the payment',
    example: 1000,
  })
  amount: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Currency of the payment',
    example: 'EUR',
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
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentIntentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Payment Intent ID to confirm',
    example: 'pi_1234567890',
  })
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Payment method ID (if not already attached)',
    example: 'pm_1234567890',
  })
  paymentMethodId?: string;
}

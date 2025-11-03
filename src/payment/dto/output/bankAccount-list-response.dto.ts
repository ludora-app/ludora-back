import Stripe from 'stripe';
import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDto } from 'src/interfaces/response-type';
import { PaginationResponseDto } from 'src/interfaces/pagination-response-type';

import { FutureRequirementsDto, RequirementsDto } from './stripe-responses.dto';

export class BankAccountListResponseDataDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  holder_name: string;

  @ApiProperty({ type: String })
  bank_name: string;

  @ApiProperty({ type: String })
  last4: string;

  @ApiProperty({ type: String })
  routing_number: string;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  country: string;

  @ApiProperty({ type: Boolean })
  default_for_currency: boolean;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: FutureRequirementsDto })
  future_requirements: Stripe.BankAccount.FutureRequirements;

  @ApiProperty({ type: RequirementsDto })
  requirements: Stripe.BankAccount.Requirements;
}

export const BankAccountListResponseDto = PaginationResponseDto(BankAccountListResponseDataDto);

export class BankAccountResponseDto extends ResponseTypeDto<BankAccountListResponseDataDto> {
  @ApiProperty({ type: BankAccountListResponseDataDto })
  data: BankAccountListResponseDataDto;
}

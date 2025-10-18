import Stripe from 'stripe';
import { SuccessTypeDto } from 'src/interfaces/success-type';
import { ResponseTypeDto } from 'src/interfaces/response-type';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PaymentService } from './payment.service';
import { PaymentIntentDto } from './dto/input/payment-intent.dto';
import { BankAccountDataDto } from './dto/output/stripe-responses.dto';
import { CreateStripeAccountDto } from './dto/input/create-stripe-account.dto';
import { StripeAccountResponseDto } from './dto/output/stripe-connect-response.dto';
import { BankDetailsDto, UpdateBankDetailsDto } from './dto/input/bank-details.dto';
import {
  BankAccountListResponseDataDto,
  BankAccountListResponseDto,
} from './dto/output/bankAccount-list-response.dto';

@UseGuards(AuthB2CGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('connect')
  @ApiOperation({
    summary: 'Récupère le compte Stripe connecté.',
  })
  @ApiOkResponse({
    description: 'Stripe connect account retrieved successfully',
    type: StripeAccountResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error retrieving Stripe connect account',
    type: BadRequestException,
  })
  async getStripeConnectAccount(@Req() request: Request): Promise<ResponseTypeDto<Stripe.Account>> {
    const userId = request['user'].id;
    const stripeAccount = await this.paymentService.getStripeConnectAccount(userId);

    return {
      data: stripeAccount,
      message: 'stripe connect account fetched',
    };
  }

  @Post('connect')
  @ApiOperation({
    summary: 'Create a Stripe connect account.',
  })
  @ApiBadRequestResponse({
    description: 'Error creating Stripe connect account',
    type: BadRequestException,
  })
  @ApiNoContentResponse({
    description: 'Stripe connect account created successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createStripeConnectAccount(
    @Req() request: Request,
    @Body() stripeAccountData: CreateStripeAccountDto,
  ): Promise<void> {
    const userId = request['user'].id;
    return this.paymentService.createStripeConnectAccount(userId, stripeAccountData);
  }

  @Post('payment-intent')
  async createPaymentIntent(@Body() { amount, connectedAccountId, paymentMethodId }) {
    const currency = 'EUR';
    const paymentIntent: PaymentIntentDto = {
      amount,
      connectedAccountId,
      currency,
      paymentMethodId,
    };
    return this.paymentService.createPaymentIntent(paymentIntent);
  }

  // add bank account to connect account

  @Post('bank-accounts')
  @ApiOperation({
    summary: 'add bank account to connect account',
  })
  @ApiBadRequestResponse({
    description: 'Error adding bank account',
    type: BadRequestException,
  })
  @ApiNoContentResponse({
    description: 'Bank account added successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async addBankAccount(
    @Body() bankDetails: BankDetailsDto,
    @Req() request: Request,
  ): Promise<void> {
    const userId = request['user'].id;
    await this.paymentService.addBankAccount(userId, bankDetails);
  }

  @Get('bank-accounts')
  @ApiOperation({
    summary: 'Get all bank accounts',
  })
  @ApiOkResponse({
    description: 'Bank accounts retrieved successfully',
    type: BankAccountListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error retrieving bank accounts',
    type: BadRequestException,
  })
  async getBankAccountsList(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<BankAccountListResponseDataDto>> {
    const userUid = request['user'].uid;
    const result = await this.paymentService.getBankAccountsList(userUid);
    return {
      data: result,
      message: 'Bank accounts fetched successfully',
      status: 200,
    };
  }

  @Get('bank-accounts/:bankAccountId')
  @ApiOperation({
    summary: 'Get a bank account',
  })
  @ApiParam({ name: 'bankAccountId', type: String })
  @ApiOkResponse({
    description: 'Bank account retrieved successfully',
    type: BankAccountDataDto,
  })
  @ApiBadRequestResponse({
    description: 'Error retrieving bank account',
    type: BadRequestException,
  })
  async getBankAccount(
    @Req() request: Request,
    @Param('bankAccountId') bankAccountId: string,
  ): Promise<ResponseTypeDto<Stripe.ExternalAccount>> {
    const userId = request['user'].id;
    const bankAccount = await this.paymentService.getBankAccount(userId, bankAccountId);
    return {
      data: bankAccount,
      message: 'Bank account fetched successfully',
      status: 200,
    };
  }

  @Put('bank-accounts/:bankAccountId')
  @ApiOperation({
    summary: 'Update a bank account',
  })
  @ApiOkResponse({
    description: 'Bank account updated successfully',
    type: SuccessTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Error updating bank account',
    type: BadRequestException,
  })
  async updateBankAccount(
    @Body() bankDetails: UpdateBankDetailsDto,
    @Req() request: Request,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    const userId = request['user'].id;
    return this.paymentService.updateDefaultBankAccount(userId, bankAccountId, bankDetails);
  }

  @Delete('bank-accounts/:bankAccountId')
  @ApiOperation({
    summary: 'Delete a bank account',
  })
  @ApiOkResponse({
    description: 'Bank account deleted successfully',
    type: SuccessTypeDto,
  })
  @ApiBadRequestResponse({
    description: 'Error deleting bank account',
    type: BadRequestException,
  })
  async deleteBankAccount(@Param('bankAccountId') bankAccountId: string, @Req() request: Request) {
    const userId = request['user'].id;
    return this.paymentService.deleteBankAccount(userId, bankAccountId);
  }
}

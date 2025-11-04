import Stripe from 'stripe';
import { ResponseTypeDto } from 'src/interfaces/response-type';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
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
import { ConfirmPaymentIntentDto } from './dto/input/confirm-payment.dto';
import { PaymentIntentTestDto } from './dto/input/payment-intent-test.dto';
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
    const userUid = request['user'].uid;
    const stripeAccount = await this.paymentService.getStripeConnectAccount(userUid);

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
    const userId = request['user'].uid;
    return this.paymentService.createStripeConnectAccount(userId, stripeAccountData);
  }

  @Post('payment-intent')
  @ApiOperation({
    summary: 'Create a payment intent with Stripe',
  })
  @ApiOkResponse({
    description: 'Payment intent created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error creating payment intent',
    type: BadRequestException,
  })
  async createPaymentIntent(@Body() paymentIntentDto: PaymentIntentDto) {
    return this.paymentService.createPaymentIntent(paymentIntentDto);
  }

  @Post('payment-intent/confirm')
  @ApiOperation({
    summary: 'Confirm a payment intent (for mobile wallets)',
  })
  @ApiOkResponse({
    description: 'Payment intent confirmed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error confirming payment intent',
    type: BadRequestException,
  })
  async confirmPaymentIntent(@Body() confirmPaymentIntent: ConfirmPaymentIntentDto) {
    return this.paymentService.confirmPaymentIntent(confirmPaymentIntent);
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
    const userId = request['user'].uid;
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
  @HttpCode(HttpStatus.OK)
  async getBankAccountsList(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<BankAccountListResponseDataDto>> {
    const userUid = request['user'].uid;
    const result = await this.paymentService.getBankAccountsList(userUid);
    return {
      data: result,
      message: 'Bank accounts fetched successfully',
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
  @HttpCode(HttpStatus.OK)
  async getBankAccount(
    @Req() request: Request,
    @Param('bankAccountId') bankAccountId: string,
  ): Promise<ResponseTypeDto<Stripe.ExternalAccount>> {
    const userId = request['user'].uid;
    const bankAccount = await this.paymentService.getBankAccount(userId, bankAccountId);
    return {
      data: bankAccount,
      message: 'Bank account retrieved successfully',
    };
  }

  @Put('bank-accounts/:bankAccountId')
  @ApiOperation({
    summary: 'Update a bank account',
  })
  @ApiNoContentResponse({
    description: 'Bank account updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error updating bank account',
    type: BadRequestException,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBankAccount(
    @Body() bankDetails: UpdateBankDetailsDto,
    @Req() request: Request,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    const userId = request['user'].uid;
    return this.paymentService.updateDefaultBankAccount(userId, bankAccountId, bankDetails);
  }

  @Delete('bank-accounts/:bankAccountId')
  @ApiOperation({
    summary: 'Delete a bank account',
  })
  @ApiNoContentResponse({
    description: 'Bank account deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error deleting bank account',
    type: BadRequestException,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBankAccount(
    @Param('bankAccountId') bankAccountId: string,
    @Req() request: Request,
  ): Promise<void> {
    const userId = request['user'].uid;
    return this.paymentService.deleteBankAccount(userId, bankAccountId);
  }

  // ===== TESTING ENDPOINTS (DEVELOPMENT ONLY) =====

  @UseGuards(DevOnlyGuard)
  @Post('payment-intent/test')
  @ApiOperation({
    summary: 'Create a payment intent with a test card (for development only)',
  })
  @ApiCreatedResponse({
    description: 'Payment intent created successfully with test card',
  })
  @ApiBadRequestResponse({
    description: 'Error creating payment intent with test card',
    type: BadRequestException,
  })
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntentWithTestCard(
    @Body() paymentIntentData: PaymentIntentTestDto,
  ): Promise<ResponseTypeDto<Stripe.PaymentIntent>> {
    const paymentIntent =
      await this.paymentService.createPaymentIntentWithTestCard(paymentIntentData);
    return {
      data: paymentIntent,
      message: 'Payment intent created successfully with test card',
    };
  }

  @UseGuards(DevOnlyGuard)
  @Post('payment-method/test')
  @ApiOperation({
    summary: 'Create a test payment method (for development only)',
  })
  @ApiOkResponse({
    description: 'Test payment method created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error creating test payment method',
    type: BadRequestException,
  })
  async createTestPaymentMethod() {
    return this.paymentService.createPaymentMethodForTesting();
  }
}

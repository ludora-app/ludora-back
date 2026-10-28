import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthB2BGuard } from 'src/auth/guards/auth-b2b.guard';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { DevOnlyGuard } from 'src/shared/guards/dev-only.guard';
import { SWAGGER_TAG_PAYMENT } from 'src/swagger/swagger.config';
import Stripe from 'stripe';
import { BankDetailsDto, UpdateBankDetailsDto } from './dto/input/bank-details.dto';
import { ConfirmPaymentIntentDto } from './dto/input/confirm-payment.dto';
import { PaymentIntentDto } from './dto/input/payment-intent.dto';
import { PaymentIntentTestDto } from './dto/input/payment-intent-test.dto';
import {
  BankAccountListResponseDataDto,
  BankAccountListResponseDto,
} from './dto/output/bankAccount-list-response.dto';
import { StripeAccountResponseDto } from './dto/output/stripe-connect-response.dto';
import { BankAccountDataDto } from './dto/output/stripe-responses.dto';
import { PaymentService } from './payment.service';

@ApiTags(SWAGGER_TAG_PAYMENT)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe-connect-account')
  @Protected()
  @UseGuards(AuthB2BGuard)
  @ApiOperation({
    summary: 'Create a Stripe connect account.',
  })
  @ApiBadRequestResponse({
    description: 'Error creating Stripe connect account',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({
    description: 'Stripe connect account created successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createStripeConnectAccount(
    @CurrentUser('organisationUid') partnerUid: string,
  ): Promise<void> {
    return this.paymentService.createStripeConnectAccount(partnerUid);
  }

  @Post('stripe-connect-account/link')
  @Protected()
  @UseGuards(AuthB2BGuard)
  @ApiOperation({
    summary: 'Generate a Stripe connect account onboarding link.',
  })
  @ApiBadRequestResponse({
    description: 'Error generating Stripe connect account link',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiOkResponse({
    description: 'Stripe connect account link generated successfully',
  })
  @HttpCode(HttpStatus.OK)
  async generateStripeAccountLink(
    @CurrentUser('organisationUid') partnerUid: string,
  ): Promise<{ url: string }> {
    return this.paymentService.generateStripeAccountLink(partnerUid);
  }

  @Get('stripe-connect-account/refresh-link')
  @Protected()
  @UseGuards(AuthB2BGuard)
  @ApiOperation({
    summary: 'Refresh a Stripe connect account onboarding link.',
  })
  @ApiBadRequestResponse({
    description: 'Error refreshing Stripe connect account link',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiOkResponse({
    description: 'Stripe connect account link refreshed successfully',
  })
  @HttpCode(HttpStatus.OK)
  async refreshStripeAccountLink(
    @CurrentUser('organisationUid') partnerUid: string,
  ): Promise<{ url: string }> {
    // We use the same service method since type='account_onboarding' works for both
    return this.paymentService.generateStripeAccountLink(partnerUid);
  }

  @Post('payment-intent')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({
    summary: 'Create a payment intent with Stripe',
  })
  @ApiOkResponse({
    description: 'Payment intent created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error creating payment intent',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async createPaymentIntent(@Body() paymentIntentDto: PaymentIntentDto) {
    return this.paymentService.createPaymentIntent(paymentIntentDto);
  }

  @Post('payment-intent/confirm')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({
    summary: 'Confirm a payment intent (for mobile wallets)',
  })
  @ApiOkResponse({
    description: 'Payment intent confirmed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error confirming payment intent',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async confirmPaymentIntent(@Body() confirmPaymentIntent: ConfirmPaymentIntentDto) {
    return this.paymentService.confirmPaymentIntent(confirmPaymentIntent);
  }

  // add bank account to connect account

  @Post('bank-accounts')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({
    summary: 'add bank account to connect account',
  })
  @ApiBadRequestResponse({
    description: 'Error adding bank account',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiNoContentResponse({
    description: 'Bank account added successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async addBankAccount(
    @Body() bankDetails: BankDetailsDto,
    @CurrentUser('uid') userUid: string,
  ): Promise<void> {
    await this.paymentService.addBankAccount(userUid, bankDetails);
  }

  @Get('stripe-connect-account')
  @Protected()
  @UseGuards(AuthB2BGuard)
  @ApiOperation({
    summary: 'Récupère le compte Stripe connecté.',
  })
  @ApiOkResponse({
    description: 'Stripe connect account retrieved successfully',
    type: StripeAccountResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error retrieving Stripe connect account',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async getStripeConnectAccount(
    @CurrentUser('organisationUid') partnerUid: string,
  ): Promise<ResponseTypeDto<Stripe.Account>> {
    const stripeAccount = await this.paymentService.getStripeConnectAccount(partnerUid);

    return {
      data: stripeAccount,
      message: 'stripe connect account fetched',
    };
  }

  @Get('list-bank-accounts')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({
    summary: 'Get all bank accounts',
  })
  @ApiOkResponse({
    description: 'Bank accounts retrieved successfully',
    type: BankAccountListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error retrieving bank accounts',
    type: BadRequestResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getBankAccountsList(
    @CurrentUser('uid') userUid: string,
  ): Promise<PaginationResponseTypeDto<BankAccountListResponseDataDto>> {
    const result = await this.paymentService.getBankAccountsList(userUid);
    return {
      data: result,
      message: 'Bank accounts fetched successfully',
    };
  }

  @Get('bank-accounts/:bankAccountId')
  @Protected()
  @UseGuards(AuthB2CGuard)
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
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getBankAccount(
    @CurrentUser('uid') userUid: string,
    @Param('bankAccountId') bankAccountId: string,
  ): Promise<ResponseTypeDto<Stripe.ExternalAccount>> {
    const bankAccount = await this.paymentService.getBankAccount(userUid, bankAccountId);
    return {
      data: bankAccount,
      message: 'Bank account retrieved successfully',
    };
  }

  @Put('bank-accounts/:bankAccountId')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiBadRequestResponse({
    description: 'Error updating bank account',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiOperation({
    summary: 'Update a bank account',
  })
  @ApiNoContentResponse({
    description: 'Bank account updated successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBankAccount(
    @Body() bankDetails: UpdateBankDetailsDto,
    @CurrentUser('uid') userUid: string,
    @Param('bankAccountId') bankAccountId: string,
  ) {
    return this.paymentService.updateDefaultBankAccount(userUid, bankAccountId, bankDetails);
  }

  @Delete('bank-accounts/:bankAccountId')
  @Protected()
  @UseGuards(AuthB2CGuard)
  @ApiOperation({
    summary: 'Delete a bank account',
  })
  @ApiParam({ name: 'bankAccountId', type: String })
  @ApiNoContentResponse({
    description: 'Bank account deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error deleting bank account',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBankAccount(
    @CurrentUser('uid') userUid: string,
    @Param('bankAccountId') bankAccountId: string,
  ): Promise<void> {
    return this.paymentService.deleteBankAccount(userUid, bankAccountId);
  }

  // ===== TESTING ENDPOINTS (DEVELOPMENT ONLY) =====

  @UseGuards(DevOnlyGuard)
  @ApiExcludeEndpoint()
  @Post('payment-intent/test')
  @UseGuards(DevOnlyGuard)
  @Protected()
  @ApiOperation({
    summary: 'Create a payment intent with a test card (for development only)',
  })
  @ApiCreatedResponse({
    description: 'Payment intent created successfully with test card',
  })
  @ApiBadRequestResponse({
    description: 'Error creating payment intent with test card',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
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
  @ApiExcludeEndpoint()
  @Protected()
  @ApiOperation({
    summary: 'Create a test payment method (for development only)',
  })
  @ApiOkResponse({
    description: 'Test payment method created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Error creating test payment method',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  async createTestPaymentMethod() {
    return this.paymentService.createPaymentMethodForTesting();
  }
}

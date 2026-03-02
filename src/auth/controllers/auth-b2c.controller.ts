import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Patch,
  Post,
  Redirect,
  Req,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Users } from 'generated/prisma/browser';
import { Provider } from 'generated/prisma/enums';
import {
  CreateImageDto,
  LoginDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RegisterB2CWithFileDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  VerifyMailDto,
  VerifyTokenResponseDto,
} from 'src/auth/dto';
import { UploadedFilesCustom } from 'src/shared/decorators/uploaded-files.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { SuccessTypeDto } from 'src/shared/dto/responses/success-type';
import { FastifyFilesInterceptor } from 'src/shared/interceptors/fastify-file.interceptor';
import { ForgottenPasswordDto } from 'src/users/dto/input/forgotten-password.dto';
import { Protected } from '../../shared/decorators/protected.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { ResetPassword } from '../decorators/reset-password.decorator';
import { CreateGoogleUserDto } from '../dto/input/create-google-user.dto';
import { CreateOrConnectGoogleResponseDto } from '../dto/output/create-or-connect-google.response';
import { GenerateAccessTokenFromCodeDto } from '../dto/output/generate-access-token-from-code.dto';
import { AuthB2CGuard } from '../guards/auth-b2c.guard';
import { VerifyEmailGuard } from '../guards/verify-email.guard';
import { AuthB2CService } from '../services/auth-b2c.service';

@Controller('auth-b2c')
@UseGuards(AuthB2CGuard)
export class AuthB2CController {
  constructor(private readonly authService: AuthB2CService) {}

  @Public()
  @Post('register')
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  @ApiOperation({ summary: 'Create a user account' })
  @ApiCreatedResponse({ description: 'User created successfully', type: RegisterResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: RegisterB2CWithFileDto })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterB2CWithFileDto,
    @UploadedFilesCustom() files?: { buffer: Buffer; originalname: string }[],
  ): Promise<RegisterResponseDto> {
    if (files && files.length > 0) {
      const createImageDto: CreateImageDto = {
        file: files[0].buffer,
        name: files[0].originalname,
      };
      const response = await this.authService.register(registerDto, createImageDto);
      return {
        data: { accessToken: response.accessToken, refreshToken: response.refreshToken },
        message: 'User created successfully',
      };
    }

    const response = await this.authService.register(registerDto);
    return {
      data: { accessToken: response.accessToken, refreshToken: response.refreshToken },
      message: 'User created successfully',
    };
  }

  @Public()
  @Post('/google-login')
  @ApiOperation({
    summary: 'Creates or connects a user with a Google account',
  })
  @ApiCreatedResponse({
    description: 'User created or connected successfully',
    type: CreateOrConnectGoogleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error during Google user creation or connection',
    type: BadRequestResponseDto,
  })
  @ApiBody({ type: CreateGoogleUserDto })
  async createOrConnectGoogleUser(
    @Body() createGoogleUserDto: CreateGoogleUserDto,
  ): Promise<CreateOrConnectGoogleResponseDto> {
    const provider = Provider.GOOGLE;
    createGoogleUserDto.provider = provider;
    const data = await this.authService.createOrConnectGoogleUser(createGoogleUserDto);
    return {
      data: {
        accessToken: data.accessToken,
        isNewUser: data.isNewUser,
        refreshToken: data.refreshToken,
      },
      message: data.message,
    };
  }

  @Public()
  @Post('/login')
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'production' ? 5 : 1000,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary: 'Allow the user to login',
  })
  @ApiBadRequestResponse({
    type: BadRequestResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const tokens = await this.authService.login(loginDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Token created successfully',
    };
  }

  @Public()
  @Post('verify-mail')
  @ApiOperation({
    summary:
      'Allows to verify if an email is available or not, unprotected route used during the registration process',
  })
  @ApiBadRequestResponse({
    description: 'Error during email verification',
    type: BadRequestResponseDto,
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyMailDto: VerifyMailDto): Promise<VerifyEmailResponseDto> {
    const isAvailable = await this.authService.verifyEmail(verifyMailDto);
    return {
      data: { isAvailable: isAvailable },
      message: `Email is ${isAvailable ? 'available' : 'already used'}`,
    };
  }

  @Public() //? bypass the auth-b2c guard
  @UseGuards(VerifyEmailGuard)
  @Get('verify-email-link')
  @Redirect('https://www.ludora.fr/email-verified', 302)
  @ApiOperation({
    summary: 'Allows a user to verify his email by clicking on the link in the email',
  })
  @ApiBadRequestResponse({
    description: 'Error during email verification',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired code',
    type: UnauthorizedResponseDto,
  })
  @ApiOkResponse({
    description: 'Redirects to the email verified page',
  })
  async verifyEmailCode(@Request() req): Promise<void> {
    const user = req.user as Users;
    await this.authService.verifyEmailLink(user);
  }

  @Protected()
  @Post('resend-verification-code')
  @ApiOperation({
    summary: 'Resend the verification code',
  })
  @ApiBadRequestResponse({
    description: 'Error during verification code resend',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @ApiOkResponse({
    description: 'Verification code resent successfully',
    type: SuccessTypeDto,
  })
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Request() req): Promise<SuccessTypeDto> {
    await this.authService.resendVerificationCode(req.user.uid);

    return {
      message: 'Verification code resent successfully',
    };
  }

  @Public()
  @Post('refresh-token')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
  })
  @ApiBadRequestResponse({
    description: 'Error during token refresh',
    type: BadRequestResponseDto,
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return {
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      message: 'Tokens refreshed successfully',
    };
  }

  @Protected()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user from current device',
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<LogoutResponseDto> {
    const { uid } = req.user;
    await this.authService.logout(uid);

    return {
      message: 'Logged out successfully',
    };
  }

  @Protected()
  @Post('logout-all-devices')
  @ApiOperation({
    summary: 'Logout user from all devices',
  })
  @ApiOkResponse({
    description: 'Logged out from all devices successfully',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logoutAllDevices(@Request() req): Promise<LogoutResponseDto> {
    const { uid } = req.user;
    await this.authService.logoutAllDevices(uid);

    return {
      message: 'Logged out from all devices successfully',
    };
  }

  @Public()
  @Post('generate-access-token-from-code')
  @Throttle({ default: { limit: 5, ttl: 1800000 } })
  @ApiOperation({
    summary: 'Generate an access token from a verification code',
  })
  @ApiBadRequestResponse({
    description: 'Error during access token generation',
    type: BadRequestResponseDto,
  })
  @ApiOkResponse({
    description: 'Access token generated successfully',
    schema: {
      properties: {
        resetToken: { type: 'string' },
      },
      type: 'object',
    },
  })
  @HttpCode(HttpStatus.OK)
  async generateAccessTokenFromCode(
    @Body() generateAccessTokenFromCodeDto: GenerateAccessTokenFromCodeDto,
  ): Promise<{ resetToken: string }> {
    const resetToken = await this.authService.generateAccessTokenFromCode(
      generateAccessTokenFromCodeDto.code,
      generateAccessTokenFromCodeDto.email,
    );
    return { resetToken: resetToken };
  }

  @Protected()
  @Get('verify')
  @ApiOperation({
    summary: 'Verify the validity of the token & the user account',
  })
  @ApiBadRequestResponse({
    description: 'Error during token verification',
    type: BadRequestResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token invalid: user missing',
    type: UnauthorizedResponseDto,
  })
  @ApiOkResponse({
    description: 'Token is valid',
    type: VerifyTokenResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Req() request: Request): Promise<VerifyTokenResponseDto> {
    const uid = request['user'].uid;

    const isValid = await this.authService.verifyToken(uid);
    return { data: { isValid: isValid }, message: 'token is valid' };
  }

  // **************************/
  // ** GOOGLE AUTHENTICATION *
  // **************************/

  @Public() // ? décorateur @Public() pour ignorer le middleware d'authentification
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res): Promise<any> {
    try {
      if (req?.user || req?.user.id) {
        throw new NotFoundException('User not found in request');
      }

      const response = await this.authService.googleLogin(req.user.id);
      // !! changer l'addresse de redirection pour le front
      return res.redirect(`http://localhost:3000?token=${response.accessToken}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('/password-reset')
  @ResetPassword()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Protected()
  @ApiOperation({
    summary: 'This method is used to reset the password of a user when he forgot his password',
  })
  @ApiBadRequestResponse({
    description: 'Error resetting password',
    type: BadRequestResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Verification code not found',
    type: NotFoundResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async passwordReset(
    @Body() dto: ForgottenPasswordDto,
    @Req() request: Request,
  ): Promise<LoginResponseDto> {
    const userUid = request['user'].uid;
    const { accessToken, refreshToken } = await this.authService.resetForgottenPassword(
      dto.newPassword,
      userUid,
    );
    return {
      data: { accessToken: accessToken, refreshToken: refreshToken },
      message: 'Password reset successfully',
    };
  }
}
